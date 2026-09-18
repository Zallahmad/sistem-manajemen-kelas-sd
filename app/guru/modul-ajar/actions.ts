"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  teachingModules,
  documentVersions,
  teachers,
  teacherClassAssignments,
  classrooms,
  subjects,
  academicYears,
  semesters,
  schools,
  auditLogs,
} from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import {
  TeachingModuleContent,
  DocumentStatus,
  getPhaseByGradeLevel,
} from "@/lib/data/teaching-modules";

export type ActionResponse = {
  success: boolean;
  error?: string;
  id?: string;
  versionNumber?: number;
};

// Zod Schema for Teaching Module Form
export const teachingModuleFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul Modul Ajar minimal 3 karakter."),
  topic: z.string().min(2, "Topik pembelajaran wajib diisi."),
  classroomId: z.string().min(1, "Kelas wajib dipilih."),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih."),
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  semesterId: z.string().min(1, "Semester wajib dipilih."),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),

  // Identity Detail
  timeAllocation: z.string().min(1, "Alokasi waktu wajib diisi."),
  subTopic: z.string().optional().default(""),
  targetStudents: z.string().optional().default("Peserta Didik Reguler / Tipikal"),
  learningModel: z.string().optional().default("Tatap Muka / Problem-Based Learning"),

  // Learning Components
  initialCompetencies: z.string().min(3, "Kompetensi awal wajib diisi."),
  pancasilaProfile: z.array(z.string()).default([]),
  learningObjectives: z.string().min(5, "Tujuan pembelajaran wajib diisi."),
  meaningfulUnderstanding: z.string().optional().default(""),
  triggerQuestions: z.string().optional().default(""),
  learningMaterials: z.string().min(3, "Materi pokok pembelajaran wajib diisi."),
  mediaAndTools: z.string().min(2, "Media, alat, dan bahan wajib diisi."),
  learningSources: z.string().min(2, "Sumber belajar wajib diisi."),

  // Activities
  openingActivities: z.string().min(5, "Kegiatan pendahuluan wajib diisi."),
  coreActivities: z.string().min(5, "Kegiatan inti pembelajaran wajib diisi."),
  closingActivities: z.string().min(5, "Kegiatan penutup wajib diisi."),
  meetingNotes: z.string().optional().default(""),

  // Assessments
  diagnosticAssessment: z.string().optional().default(""),
  formativeAssessment: z.string().min(3, "Asesmen formatif wajib diisi."),
  summativeAssessment: z.string().min(3, "Asesmen sumatif wajib diisi."),
  rubricAndCriteria: z.string().optional().default(""),

  // Differentiation
  contentDifferentiation: z.string().optional().default(""),
  processDifferentiation: z.string().optional().default(""),
  productDifferentiation: z.string().optional().default(""),

  // Follow-up
  remedial: z.string().min(2, "Kegiatan remedial wajib diisi."),
  enrichment: z.string().min(2, "Kegiatan pengayaan wajib diisi."),

  // Reflection
  teacherReflection: z.string().min(2, "Refleksi guru wajib diisi."),
  studentReflection: z.string().min(2, "Refleksi peserta didik wajib diisi."),

  // Attachments
  studentWorksheetOverview: z.string().optional().default(""),
  readingMaterials: z.string().optional().default(""),
  glossary: z.string().optional().default(""),
  bibliography: z.string().optional().default(""),
});

export type TeachingModuleInput = z.infer<typeof teachingModuleFormSchema>;

// Helper to verify all master relations in the same school and teacher authorization
async function verifyRelationsAndTeacher(
  userSchoolId: string,
  teacherUserId: string,
  data: {
    classroomId: string;
    subjectId: string;
    academicYearId: string;
    semesterId: string;
  }
) {
  // 1. Teacher profile
  const teacherRecord = await db
    .select({
      id: teachers.id,
      schoolId: teachers.schoolId,
      fullName: teachers.fullName,
      employeeNumber: teachers.employeeNumber,
    })
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, teacherUserId),
        eq(teachers.schoolId, userSchoolId),
        isNull(teachers.deletedAt)
      )
    )
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return { ok: false as const, error: "Profil guru tidak ditemukan atau tidak aktif." };
  }

  // 2. School info
  const schoolRecord = await db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(and(eq(schools.id, userSchoolId), isNull(schools.deletedAt)))
    .limit(1);

  const school = schoolRecord[0];
  if (!school) {
    return { ok: false as const, error: "Data sekolah tidak valid." };
  }

  // 3. Classroom verification & Teacher Assignment check
  const classroomRecord = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      schoolId: classrooms.schoolId,
      academicYearId: classrooms.academicYearId,
    })
    .from(classrooms)
    .where(
      and(
        eq(classrooms.id, data.classroomId),
        eq(classrooms.schoolId, userSchoolId),
        isNull(classrooms.deletedAt)
      )
    )
    .limit(1);

  const classroom = classroomRecord[0];
  if (!classroom) {
    return { ok: false as const, error: "Rombongan belajar (kelas) tidak ditemukan pada sekolah Anda." };
  }

  const assignment = await db
    .select({ id: teacherClassAssignments.id })
    .from(teacherClassAssignments)
    .where(
      and(
        eq(teacherClassAssignments.teacherId, teacher.id),
        eq(teacherClassAssignments.classroomId, data.classroomId),
        eq(teacherClassAssignments.isActive, true)
      )
    )
    .limit(1);

  if (assignment.length === 0) {
    return {
      ok: false as const,
      error: "Anda tidak memiliki akses penugasan mengajar pada kelas ini.",
    };
  }

  // 4. Subject verification
  const subjectRecord = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      schoolId: subjects.schoolId,
    })
    .from(subjects)
    .where(
      and(
        eq(subjects.id, data.subjectId),
        eq(subjects.schoolId, userSchoolId),
        isNull(subjects.deletedAt)
      )
    )
    .limit(1);

  const subject = subjectRecord[0];
  if (!subject) {
    return { ok: false as const, error: "Mata pelajaran tidak ditemukan pada sekolah Anda." };
  }

  // 5. Academic Year verification
  const academicYearRecord = await db
    .select({ id: academicYears.id, name: academicYears.name })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, data.academicYearId),
        eq(academicYears.schoolId, userSchoolId)
      )
    )
    .limit(1);

  const academicYear = academicYearRecord[0];
  if (!academicYear) {
    return { ok: false as const, error: "Tahun ajaran tidak valid pada sekolah Anda." };
  }

  // 6. Semester verification (must belong to the academicYear)
  const semesterRecord = await db
    .select({
      id: semesters.id,
      name: semesters.name,
      academicYearId: semesters.academicYearId,
    })
    .from(semesters)
    .where(
      and(
        eq(semesters.id, data.semesterId),
        eq(semesters.academicYearId, data.academicYearId)
      )
    )
    .limit(1);

  const semester = semesterRecord[0];
  if (!semester) {
    return { ok: false as const, error: "Semester tidak sesuai dengan tahun ajaran yang dipilih." };
  }

  return {
    ok: true as const,
    teacher,
    school,
    classroom,
    subject,
    academicYear,
    semester,
  };
}

// 1. Create Teaching Module Action (with Transaction and Initial Document Version v1)
export async function createTeachingModuleAction(
  payload: TeachingModuleInput
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const parsed = teachingModuleFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data Modul Ajar tidak valid.",
    };
  }

  const data = parsed.data;

  // Verify relations and ownership
  const verified = await verifyRelationsAndTeacher(user.schoolId, user.id, {
    classroomId: data.classroomId,
    subjectId: data.subjectId,
    academicYearId: data.academicYearId,
    semesterId: data.semesterId,
  });

  if (!verified.ok) {
    return { success: false, error: verified.error };
  }

  const { teacher, school, classroom, subject, academicYear, semester } = verified;

  // Build structured JSON content
  const structuredContent: TeachingModuleContent = {
    identity: {
      schoolName: school.name,
      teacherName: teacher.fullName,
      classroomName: classroom.name,
      gradeLevel: classroom.gradeLevel,
      phase: getPhaseByGradeLevel(classroom.gradeLevel),
      semesterName: `Semester ${semester.name}`,
      academicYearName: academicYear.name,
      subjectName: subject.name,
      subjectCode: subject.code,
      topic: data.topic,
      subTopic: data.subTopic,
      timeAllocation: data.timeAllocation,
      targetStudents: data.targetStudents,
      learningModel: data.learningModel,
    },
    learningComponents: {
      initialCompetencies: data.initialCompetencies,
      pancasilaProfile: data.pancasilaProfile,
      learningObjectives: data.learningObjectives,
      meaningfulUnderstanding: data.meaningfulUnderstanding,
      triggerQuestions: data.triggerQuestions,
      learningMaterials: data.learningMaterials,
      mediaAndTools: data.mediaAndTools,
      learningSources: data.learningSources,
    },
    activities: {
      openingActivities: data.openingActivities,
      coreActivities: data.coreActivities,
      closingActivities: data.closingActivities,
      meetingNotes: data.meetingNotes,
    },
    assessments: {
      diagnosticAssessment: data.diagnosticAssessment,
      formativeAssessment: data.formativeAssessment,
      summativeAssessment: data.summativeAssessment,
      rubricAndCriteria: data.rubricAndCriteria,
    },
    differentiation: {
      contentDifferentiation: data.contentDifferentiation,
      processDifferentiation: data.processDifferentiation,
      productDifferentiation: data.productDifferentiation,
    },
    followUp: {
      remedial: data.remedial,
      enrichment: data.enrichment,
    },
    reflection: {
      teacherReflection: data.teacherReflection,
      studentReflection: data.studentReflection,
    },
    attachments: {
      studentWorksheetOverview: data.studentWorksheetOverview,
      readingMaterials: data.readingMaterials,
      glossary: data.glossary,
      bibliography: data.bibliography,
    },
  };

  try {
    // Execute atomic transaction for teaching_modules and initial document_versions (v1)
    const moduleId = await db.transaction(async (tx) => {
      const insertedModule = await tx
        .insert(teachingModules)
        .values({
          schoolId: user.schoolId,
          teacherId: teacher.id,
          classroomId: data.classroomId,
          subjectId: data.subjectId,
          academicYearId: data.academicYearId,
          semesterId: data.semesterId,
          title: data.title,
          topic: data.topic,
          learningObjectives: data.learningObjectives,
          content: structuredContent,
          activities: structuredContent.activities,
          assessment: structuredContent.assessments,
          status: data.status as DocumentStatus,
        })
        .returning({ id: teachingModules.id });

      const newId = insertedModule[0].id;

      // Create v1 snapshot
      await tx.insert(documentVersions).values({
        documentType: "TEACHING_MODULE",
        documentId: newId,
        versionNumber: 1,
        content: structuredContent,
        createdBy: user.id,
      });

      // Audit Log inside transaction
      await tx.insert(auditLogs).values({
        schoolId: user.schoolId,
        userId: user.id,
        action: "CREATE_TEACHING_MODULE",
        entityType: "TEACHING_MODULE",
        entityId: newId,
        newData: {
          title: data.title,
          topic: data.topic,
          status: data.status,
          classroom: classroom.name,
          subject: subject.name,
          version: 1,
        },
      });

      return newId;
    });

    revalidatePath("/guru/modul-ajar");
    revalidatePath("/admin/modul-ajar");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true, id: moduleId, versionNumber: 1 };
  } catch (err) {
    console.error("Error creating teaching module:", err);
    return {
      success: false,
      error: "Gagal menyimpan Modul Ajar baru. Silakan periksa kembali data Anda.",
    };
  }
}

// 2. Update Teaching Module Action (with Transaction, Immutable Version Bump v2, v3...)
export async function updateTeachingModuleAction(
  moduleId: string,
  payload: TeachingModuleInput
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  if (!moduleId) {
    return { success: false, error: "ID Modul Ajar tidak ditemukan." };
  }

  const parsed = teachingModuleFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data Modul Ajar tidak valid.",
    };
  }

  const data = parsed.data;

  // Verify relations and ownership
  const verified = await verifyRelationsAndTeacher(user.schoolId, user.id, {
    classroomId: data.classroomId,
    subjectId: data.subjectId,
    academicYearId: data.academicYearId,
    semesterId: data.semesterId,
  });

  if (!verified.ok) {
    return { success: false, error: verified.error };
  }

  const { teacher, school, classroom, subject, academicYear, semester } = verified;

  // Check existing module
  const existingModule = await db
    .select({
      id: teachingModules.id,
      teacherId: teachingModules.teacherId,
      status: teachingModules.status,
      content: teachingModules.content,
    })
    .from(teachingModules)
    .where(
      and(
        eq(teachingModules.id, moduleId),
        eq(teachingModules.schoolId, user.schoolId),
        eq(teachingModules.teacherId, teacher.id),
        isNull(teachingModules.deletedAt)
      )
    )
    .limit(1);

  if (!existingModule[0]) {
    return {
      success: false,
      error: "Modul Ajar tidak ditemukan atau Anda tidak memiliki hak akses mengubah dokumen ini.",
    };
  }

  // Build structured JSON content
  const structuredContent: TeachingModuleContent = {
    identity: {
      schoolName: school.name,
      teacherName: teacher.fullName,
      classroomName: classroom.name,
      gradeLevel: classroom.gradeLevel,
      phase: getPhaseByGradeLevel(classroom.gradeLevel),
      semesterName: `Semester ${semester.name}`,
      academicYearName: academicYear.name,
      subjectName: subject.name,
      subjectCode: subject.code,
      topic: data.topic,
      subTopic: data.subTopic,
      timeAllocation: data.timeAllocation,
      targetStudents: data.targetStudents,
      learningModel: data.learningModel,
    },
    learningComponents: {
      initialCompetencies: data.initialCompetencies,
      pancasilaProfile: data.pancasilaProfile,
      learningObjectives: data.learningObjectives,
      meaningfulUnderstanding: data.meaningfulUnderstanding,
      triggerQuestions: data.triggerQuestions,
      learningMaterials: data.learningMaterials,
      mediaAndTools: data.mediaAndTools,
      learningSources: data.learningSources,
    },
    activities: {
      openingActivities: data.openingActivities,
      coreActivities: data.coreActivities,
      closingActivities: data.closingActivities,
      meetingNotes: data.meetingNotes,
    },
    assessments: {
      diagnosticAssessment: data.diagnosticAssessment,
      formativeAssessment: data.formativeAssessment,
      summativeAssessment: data.summativeAssessment,
      rubricAndCriteria: data.rubricAndCriteria,
    },
    differentiation: {
      contentDifferentiation: data.contentDifferentiation,
      processDifferentiation: data.processDifferentiation,
      productDifferentiation: data.productDifferentiation,
    },
    followUp: {
      remedial: data.remedial,
      enrichment: data.enrichment,
    },
    reflection: {
      teacherReflection: data.teacherReflection,
      studentReflection: data.studentReflection,
    },
    attachments: {
      studentWorksheetOverview: data.studentWorksheetOverview,
      readingMaterials: data.readingMaterials,
      glossary: data.glossary,
      bibliography: data.bibliography,
    },
  };

  try {
    // Compute next version number
    const latestVersion = await db
      .select({ versionNumber: documentVersions.versionNumber })
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentType, "TEACHING_MODULE"),
          eq(documentVersions.documentId, moduleId)
        )
      )
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (latestVersion[0]?.versionNumber || 0) + 1;

    await db.transaction(async (tx) => {
      // 1. Update teaching_modules
      await tx
        .update(teachingModules)
        .set({
          classroomId: data.classroomId,
          subjectId: data.subjectId,
          academicYearId: data.academicYearId,
          semesterId: data.semesterId,
          title: data.title,
          topic: data.topic,
          learningObjectives: data.learningObjectives,
          content: structuredContent,
          activities: structuredContent.activities,
          assessment: structuredContent.assessments,
          status: data.status as DocumentStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(teachingModules.id, moduleId),
            eq(teachingModules.schoolId, user.schoolId),
            eq(teachingModules.teacherId, teacher.id)
          )
        );

      // 2. Insert new immutable document version
      await tx.insert(documentVersions).values({
        documentType: "TEACHING_MODULE",
        documentId: moduleId,
        versionNumber: nextVersionNumber,
        content: structuredContent,
        createdBy: user.id,
      });

      // 3. Record audit log
      await tx.insert(auditLogs).values({
        schoolId: user.schoolId,
        userId: user.id,
        action: "UPDATE_TEACHING_MODULE",
        entityType: "TEACHING_MODULE",
        entityId: moduleId,
        newData: {
          title: data.title,
          status: data.status,
          version: nextVersionNumber,
        },
      });
    });

    revalidatePath("/guru/modul-ajar");
    revalidatePath(`/guru/modul-ajar/${moduleId}`);
    revalidatePath(`/guru/modul-ajar/${moduleId}/preview`);
    revalidatePath("/admin/modul-ajar");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true, id: moduleId, versionNumber: nextVersionNumber };
  } catch (err) {
    console.error("Error updating teaching module:", err);
    return {
      success: false,
      error: "Gagal memperbarui Modul Ajar. Silakan coba kembali.",
    };
  }
}

// 3. Publish Teaching Module Action
export async function publishTeachingModuleAction(moduleId: string): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, user.id),
        eq(teachers.schoolId, user.schoolId),
        isNull(teachers.deletedAt)
      )
    )
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return { success: false, error: "Profil guru tidak ditemukan." };

  try {
    await db
      .update(teachingModules)
      .set({
        status: "PUBLISHED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teachingModules.id, moduleId),
          eq(teachingModules.schoolId, user.schoolId),
          eq(teachingModules.teacherId, teacher.id),
          isNull(teachingModules.deletedAt)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "PUBLISH_TEACHING_MODULE",
      entityType: "TEACHING_MODULE",
      entityId: moduleId,
      newData: { status: "PUBLISHED" },
    });

    revalidatePath("/guru/modul-ajar");
    revalidatePath(`/guru/modul-ajar/${moduleId}`);
    revalidatePath(`/guru/modul-ajar/${moduleId}/preview`);
    revalidatePath("/admin/modul-ajar");

    return { success: true, id: moduleId };
  } catch {
    return { success: false, error: "Gagal mempublikasikan Modul Ajar." };
  }
}

// 4. Soft Delete / Deactivate Teaching Module Action
export async function deactivateTeachingModuleAction(moduleId: string): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, user.id),
        eq(teachers.schoolId, user.schoolId),
        isNull(teachers.deletedAt)
      )
    )
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return { success: false, error: "Profil guru tidak ditemukan." };

  try {
    await db
      .update(teachingModules)
      .set({
        deletedAt: new Date(),
        status: "ARCHIVED",
      })
      .where(
        and(
          eq(teachingModules.id, moduleId),
          eq(teachingModules.schoolId, user.schoolId),
          eq(teachingModules.teacherId, teacher.id)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "DEACTIVATE_TEACHING_MODULE",
      entityType: "TEACHING_MODULE",
      entityId: moduleId,
    });

    revalidatePath("/guru/modul-ajar");
    revalidatePath("/admin/modul-ajar");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true };
  } catch {
    return { success: false, error: "Gagal menonaktifkan Modul Ajar." };
  }
}
