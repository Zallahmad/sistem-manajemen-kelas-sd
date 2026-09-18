"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  lessonPlans,
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
  LessonPlanContent,
  DocumentStatus,
  getPhaseByGradeLevel,
} from "@/lib/data/lesson-plans";

export type ActionResponse = {
  success: boolean;
  error?: string;
  id?: string;
  versionNumber?: number;
};

// Zod Schema for Lesson Plan Form
export const lessonPlanFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul RPP minimal 3 karakter."),
  topic: z.string().min(2, "Materi / Topik pembelajaran wajib diisi."),
  subTopic: z.string().optional().default(""),
  classroomId: z.string().min(1, "Kelas wajib dipilih."),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih."),
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  semesterId: z.string().min(1, "Semester wajib dipilih."),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),

  // Identity Detail
  timeAllocation: z.string().min(1, "Alokasi waktu wajib diisi."),
  targetStudents: z.string().optional().default("Peserta Didik Reguler / Tipikal"),
  learningModel: z.string().optional().default("Problem-Based Learning (PBL)"),
  learningMethod: z.string().optional().default("Ceramah interaktif, tanya jawab, diskusi kelompok, penugasan"),
  learningApproach: z.string().optional().default("Saintifik / TPACK"),

  // Competencies & Objectives
  initialCompetencies: z.string().min(3, "Kompetensi awal wajib diisi."),
  learningAchievements: z.string().optional().default(""),
  learningObjectives: z.string().min(5, "Tujuan pembelajaran wajib diisi."),
  pancasilaProfile: z.array(z.string()).default([]),

  // Understanding & Trigger
  meaningfulUnderstanding: z.string().optional().default(""),
  triggerQuestions: z.string().optional().default(""),

  // Media & Sources
  learningMaterials: z.string().min(3, "Materi pokok pembelajaran wajib diisi."),
  mediaAndTools: z.string().min(2, "Media dan alat pembelajaran wajib diisi."),
  learningSources: z.string().min(2, "Sumber belajar wajib diisi."),

  // Activities
  openingOrientation: z.string().optional().default(""),
  openingApperception: z.string().optional().default(""),
  openingMotivation: z.string().optional().default(""),
  openingDescription: z.string().min(5, "Uraian kegiatan pendahuluan wajib diisi."),
  openingTime: z.string().optional().default("10 Menit"),

  coreExploration: z.string().optional().default(""),
  coreElaboration: z.string().optional().default(""),
  coreDiscussionOrPractice: z.string().optional().default(""),
  coreApplication: z.string().optional().default(""),
  coreDescription: z.string().min(5, "Uraian kegiatan inti pembelajaran wajib diisi."),
  coreTime: z.string().optional().default("50 Menit"),

  closingReflection: z.string().optional().default(""),
  closingSummary: z.string().optional().default(""),
  closingFollowUp: z.string().optional().default(""),
  closingDescription: z.string().min(5, "Uraian kegiatan penutup wajib diisi."),
  closingTime: z.string().optional().default("10 Menit"),

  meetingNotes: z.string().optional().default(""),

  // Assessments
  diagnosticAssessment: z.string().optional().default(""),
  formativeAssessment: z.string().min(3, "Asesmen formatif wajib diisi."),
  summativeAssessment: z.string().min(3, "Asesmen sumatif wajib diisi."),
  assessmentInstruments: z.string().optional().default(""),
  assessmentCriteria: z.string().optional().default(""),

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
  worksheetOverview: z.string().optional().default(""),
  readingMaterials: z.string().optional().default(""),
  glossary: z.string().optional().default(""),
  bibliography: z.string().optional().default(""),
});

export type LessonPlanInput = z.infer<typeof lessonPlanFormSchema>;

// Helper to verify all master relations in the same school and teacher assignment
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

// 1. Create Lesson Plan Action (with Transaction and Initial Document Version v1)
export async function createLessonPlanAction(
  payload: LessonPlanInput
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const parsed = lessonPlanFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data RPP tidak valid.",
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
  const structuredContent: LessonPlanContent = {
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
      learningMethod: data.learningMethod,
      learningApproach: data.learningApproach,
    },
    competencies: {
      initialCompetencies: data.initialCompetencies,
      learningAchievements: data.learningAchievements,
      learningObjectives: data.learningObjectives,
      pancasilaProfile: data.pancasilaProfile,
    },
    understandingAndTrigger: {
      meaningfulUnderstanding: data.meaningfulUnderstanding,
      triggerQuestions: data.triggerQuestions,
    },
    mediaAndSources: {
      learningMaterials: data.learningMaterials,
      mediaAndTools: data.mediaAndTools,
      learningSources: data.learningSources,
    },
    activities: {
      opening: {
        orientation: data.openingOrientation,
        apperception: data.openingApperception,
        motivation: data.openingMotivation,
        description: data.openingDescription,
        timeAllocation: data.openingTime,
      },
      core: {
        exploration: data.coreExploration,
        elaboration: data.coreElaboration,
        discussionOrPractice: data.coreDiscussionOrPractice,
        application: data.coreApplication,
        description: data.coreDescription,
        timeAllocation: data.coreTime,
      },
      closing: {
        reflection: data.closingReflection,
        summary: data.closingSummary,
        followUp: data.closingFollowUp,
        description: data.closingDescription,
        timeAllocation: data.closingTime,
      },
      meetingNotes: data.meetingNotes,
    },
    assessments: {
      diagnosticAssessment: data.diagnosticAssessment,
      formativeAssessment: data.formativeAssessment,
      summativeAssessment: data.summativeAssessment,
      assessmentInstruments: data.assessmentInstruments,
      assessmentCriteria: data.assessmentCriteria,
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
      worksheetOverview: data.worksheetOverview,
      readingMaterials: data.readingMaterials,
      glossary: data.glossary,
      bibliography: data.bibliography,
    },
  };

  try {
    const planId = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(lessonPlans)
        .values({
          schoolId: user.schoolId,
          teacherId: teacher.id,
          classroomId: data.classroomId,
          subjectId: data.subjectId,
          academicYearId: data.academicYearId,
          semesterId: data.semesterId,
          title: data.title,
          content: structuredContent,
          status: data.status as DocumentStatus,
        })
        .returning({ id: lessonPlans.id });

      const newId = inserted[0].id;

      // Create v1 snapshot
      await tx.insert(documentVersions).values({
        documentType: "LESSON_PLAN",
        documentId: newId,
        versionNumber: 1,
        content: structuredContent,
        createdBy: user.id,
      });

      // Record audit log
      await tx.insert(auditLogs).values({
        schoolId: user.schoolId,
        userId: user.id,
        action: "CREATE_LESSON_PLAN",
        entityType: "LESSON_PLAN",
        entityId: newId,
        newData: {
          title: data.title,
          status: data.status,
          classroom: classroom.name,
          subject: subject.name,
          version: 1,
        },
      });

      return newId;
    });

    revalidatePath("/guru/rpp");
    revalidatePath("/admin/rpp");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true, id: planId, versionNumber: 1 };
  } catch (err) {
    console.error("Error creating lesson plan:", err);
    return {
      success: false,
      error: "Gagal menyimpan RPP baru. Silakan periksa kembali data Anda.",
    };
  }
}

// 2. Update Lesson Plan Action (with Transaction, Immutable Version Bump v2, v3...)
export async function updateLessonPlanAction(
  planId: string,
  payload: LessonPlanInput
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  if (!planId) {
    return { success: false, error: "ID RPP tidak ditemukan." };
  }

  const parsed = lessonPlanFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data RPP tidak valid.",
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

  // Check existing plan
  const existingPlan = await db
    .select({
      id: lessonPlans.id,
      teacherId: lessonPlans.teacherId,
      status: lessonPlans.status,
    })
    .from(lessonPlans)
    .where(
      and(
        eq(lessonPlans.id, planId),
        eq(lessonPlans.schoolId, user.schoolId),
        eq(lessonPlans.teacherId, teacher.id),
        isNull(lessonPlans.deletedAt)
      )
    )
    .limit(1);

  if (!existingPlan[0]) {
    return {
      success: false,
      error: "RPP tidak ditemukan atau Anda tidak memiliki hak akses mengubah dokumen ini.",
    };
  }

  // Build structured JSON content
  const structuredContent: LessonPlanContent = {
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
      learningMethod: data.learningMethod,
      learningApproach: data.learningApproach,
    },
    competencies: {
      initialCompetencies: data.initialCompetencies,
      learningAchievements: data.learningAchievements,
      learningObjectives: data.learningObjectives,
      pancasilaProfile: data.pancasilaProfile,
    },
    understandingAndTrigger: {
      meaningfulUnderstanding: data.meaningfulUnderstanding,
      triggerQuestions: data.triggerQuestions,
    },
    mediaAndSources: {
      learningMaterials: data.learningMaterials,
      mediaAndTools: data.mediaAndTools,
      learningSources: data.learningSources,
    },
    activities: {
      opening: {
        orientation: data.openingOrientation,
        apperception: data.openingApperception,
        motivation: data.openingMotivation,
        description: data.openingDescription,
        timeAllocation: data.openingTime,
      },
      core: {
        exploration: data.coreExploration,
        elaboration: data.coreElaboration,
        discussionOrPractice: data.coreDiscussionOrPractice,
        application: data.coreApplication,
        description: data.coreDescription,
        timeAllocation: data.coreTime,
      },
      closing: {
        reflection: data.closingReflection,
        summary: data.closingSummary,
        followUp: data.closingFollowUp,
        description: data.closingDescription,
        timeAllocation: data.closingTime,
      },
      meetingNotes: data.meetingNotes,
    },
    assessments: {
      diagnosticAssessment: data.diagnosticAssessment,
      formativeAssessment: data.formativeAssessment,
      summativeAssessment: data.summativeAssessment,
      assessmentInstruments: data.assessmentInstruments,
      assessmentCriteria: data.assessmentCriteria,
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
      worksheetOverview: data.worksheetOverview,
      readingMaterials: data.readingMaterials,
      glossary: data.glossary,
      bibliography: data.bibliography,
    },
  };

  try {
    const latestVersion = await db
      .select({ versionNumber: documentVersions.versionNumber })
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentType, "LESSON_PLAN"),
          eq(documentVersions.documentId, planId)
        )
      )
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (latestVersion[0]?.versionNumber || 0) + 1;

    await db.transaction(async (tx) => {
      // 1. Update lesson_plans
      await tx
        .update(lessonPlans)
        .set({
          classroomId: data.classroomId,
          subjectId: data.subjectId,
          academicYearId: data.academicYearId,
          semesterId: data.semesterId,
          title: data.title,
          content: structuredContent,
          status: data.status as DocumentStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(lessonPlans.id, planId),
            eq(lessonPlans.schoolId, user.schoolId),
            eq(lessonPlans.teacherId, teacher.id)
          )
        );

      // 2. Insert new immutable document version
      await tx.insert(documentVersions).values({
        documentType: "LESSON_PLAN",
        documentId: planId,
        versionNumber: nextVersionNumber,
        content: structuredContent,
        createdBy: user.id,
      });

      // 3. Record audit log
      await tx.insert(auditLogs).values({
        schoolId: user.schoolId,
        userId: user.id,
        action: "UPDATE_LESSON_PLAN",
        entityType: "LESSON_PLAN",
        entityId: planId,
        newData: {
          title: data.title,
          status: data.status,
          version: nextVersionNumber,
        },
      });
    });

    revalidatePath("/guru/rpp");
    revalidatePath(`/guru/rpp/${planId}`);
    revalidatePath(`/guru/rpp/${planId}/preview`);
    revalidatePath("/admin/rpp");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true, id: planId, versionNumber: nextVersionNumber };
  } catch (err) {
    console.error("Error updating lesson plan:", err);
    return {
      success: false,
      error: "Gagal memperbarui RPP. Silakan coba kembali.",
    };
  }
}

// 3. Publish Lesson Plan Action
export async function publishLessonPlanAction(planId: string): Promise<ActionResponse> {
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
      .update(lessonPlans)
      .set({
        status: "PUBLISHED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lessonPlans.id, planId),
          eq(lessonPlans.schoolId, user.schoolId),
          eq(lessonPlans.teacherId, teacher.id),
          isNull(lessonPlans.deletedAt)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "PUBLISH_LESSON_PLAN",
      entityType: "LESSON_PLAN",
      entityId: planId,
      newData: { status: "PUBLISHED" },
    });

    revalidatePath("/guru/rpp");
    revalidatePath(`/guru/rpp/${planId}`);
    revalidatePath(`/guru/rpp/${planId}/preview`);
    revalidatePath("/admin/rpp");

    return { success: true, id: planId };
  } catch {
    return { success: false, error: "Gagal mempublikasikan RPP." };
  }
}

// 4. Soft Delete / Deactivate Lesson Plan Action
export async function deactivateLessonPlanAction(planId: string): Promise<ActionResponse> {
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
      .update(lessonPlans)
      .set({
        deletedAt: new Date(),
        status: "ARCHIVED",
      })
      .where(
        and(
          eq(lessonPlans.id, planId),
          eq(lessonPlans.schoolId, user.schoolId),
          eq(lessonPlans.teacherId, teacher.id)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "DEACTIVATE_LESSON_PLAN",
      entityType: "LESSON_PLAN",
      entityId: planId,
    });

    revalidatePath("/guru/rpp");
    revalidatePath("/admin/rpp");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true };
  } catch {
    return { success: false, error: "Gagal menonaktifkan RPP." };
  }
}
