"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  worksheets,
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
  WorksheetContent,
  DocumentStatus,
  getPhaseByGradeLevel,
} from "@/lib/data/worksheets";

export type ActionResponse = {
  success: boolean;
  error?: string;
  id?: string;
  versionNumber?: number;
};

// Zod Schema for Activity Item
const activityItemSchema = z.object({
  id: z.string(),
  title: z.string().min(2, "Judul aktivitas wajib diisi."),
  type: z.enum([
    "DISKUSI",
    "OBSERVASI",
    "EKSPERIMEN",
    "PRAKTIK",
    "MENCOCOKKAN",
    "MENGELOMPOKKAN",
    "MENGISI_TABEL",
    "MENJAWAB_PERTANYAAN",
    "PROYEK_SEDERHANA",
    "PRESENTASI",
    "REFLEKSI",
  ]),
  instruction: z.string().min(3, "Petunjuk langkah aktivitas wajib diisi."),
  questions: z.array(z.string()).optional().default([]),
  expectedOutput: z.string().optional().default(""),
});

// Zod Schema for Question Item
const questionItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "SHORT_ANSWER",
    "ESSAY",
    "TRUE_FALSE",
    "TABLE",
    "OBSERVATION",
  ]),
  question: z.string().min(2, "Pertanyaan / soal wajib diisi."),
  options: z.array(z.string()).optional().default([]),
  answerKey: z.string().optional().default(""),
  points: z.number().default(10),
});

// Zod Schema for Worksheet Form
export const worksheetFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul LKPD minimal 3 karakter."),
  topic: z.string().min(2, "Topik / Materi pembelajaran wajib diisi."),
  subTopic: z.string().optional().default(""),
  classroomId: z.string().min(1, "Kelas wajib dipilih."),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih."),
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  semesterId: z.string().min(1, "Semester wajib dipilih."),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),

  // Identity
  timeAllocation: z.string().min(1, "Alokasi waktu pengerjaan wajib diisi."),
  targetStudents: z.string().optional().default("Peserta Didik Reguler / Tipikal"),
  groupType: z.string().optional().default("Kelompok Kecil (4 - 5 Peserta Didik)"),

  // Instructions & Objectives
  worksheetTitle: z.string().min(2, "Judul Lembar Kerja wajib diisi."),
  generalInstructions: z.string().min(3, "Petunjuk pengerjaan wajib diisi."),
  activityObjectives: z.string().min(3, "Tujuan kegiatan LKPD wajib diisi."),
  prerequisites: z.string().optional().default(""),
  toolsAndMaterials: z.string().min(2, "Alat dan bahan wajib diisi."),
  learningSources: z.string().min(2, "Sumber belajar wajib diisi."),

  // Brief Material
  introductoryMaterial: z.string().min(3, "Materi pengantar wajib diisi."),
  keyConcepts: z.string().min(3, "Konsep penting / rangkuman materi wajib diisi."),
  examplesOrIllustrations: z.string().optional().default(""),
  supportingInfo: z.string().optional().default(""),

  // Activities & Questions
  activities: z.array(activityItemSchema).default([]),
  questions: z.array(questionItemSchema).default([]),

  // Assessment & Rubric
  assessmentCriteria: z.string().min(3, "Kriteria penilaian wajib diisi."),
  maxScore: z.number().default(100),
  simpleRubric: z.string().min(3, "Rubrik penilaian sederhana wajib diisi."),
  teacherNotes: z.string().optional().default(""),

  // Reflection
  studentReflectLearned: z.string().optional().default(""),
  studentReflectUnderstood: z.string().optional().default(""),
  studentReflectDifficult: z.string().optional().default(""),
  studentReflectFeeling: z.string().optional().default(""),

  teacherReflectAchievement: z.string().optional().default(""),
  teacherReflectNotes: z.string().optional().default(""),
  teacherReflectFollowUp: z.string().optional().default(""),

  // Attachments
  readingMaterials: z.string().optional().default(""),
  glossary: z.string().optional().default(""),
  learningSourcesAttachment: z.string().optional().default(""),
  additionalNotes: z.string().optional().default(""),
});

export type WorksheetInput = z.infer<typeof worksheetFormSchema>;

// Helper to verify relations & teacher classroom assignment
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

  // 3. Classroom & assignment verification
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

  // 6. Semester verification
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

// 1. Create Worksheet Action (with Transaction and Initial Document Version v1)
export async function createWorksheetAction(
  payload: WorksheetInput
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const parsed = worksheetFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data LKPD tidak valid.",
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
  const structuredContent: WorksheetContent = {
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
      groupType: data.groupType,
    },
    instructionsAndObjectives: {
      worksheetTitle: data.worksheetTitle,
      generalInstructions: data.generalInstructions,
      activityObjectives: data.activityObjectives,
      prerequisites: data.prerequisites,
      toolsAndMaterials: data.toolsAndMaterials,
      learningSources: data.learningSources,
    },
    briefMaterial: {
      introductoryMaterial: data.introductoryMaterial,
      keyConcepts: data.keyConcepts,
      examplesOrIllustrations: data.examplesOrIllustrations,
      supportingInfo: data.supportingInfo,
    },
    activities: data.activities,
    questions: data.questions,
    assessmentAndRubric: {
      assessmentCriteria: data.assessmentCriteria,
      maxScore: data.maxScore,
      simpleRubric: data.simpleRubric,
      teacherNotes: data.teacherNotes,
    },
    reflection: {
      studentReflection: {
        learned: data.studentReflectLearned,
        understoodMost: data.studentReflectUnderstood,
        difficultParts: data.studentReflectDifficult,
        feeling: data.studentReflectFeeling,
      },
      teacherReflection: {
        activityAchievement: data.teacherReflectAchievement,
        teacherNotes: data.teacherReflectNotes,
        followUp: data.teacherReflectFollowUp,
      },
    },
    attachments: {
      readingMaterials: data.readingMaterials,
      glossary: data.glossary,
      learningSources: data.learningSourcesAttachment,
      additionalNotes: data.additionalNotes,
    },
  };

  try {
    const worksheetId = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(worksheets)
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
        .returning({ id: worksheets.id });

      const newId = inserted[0].id;

      // Create v1 snapshot
      await tx.insert(documentVersions).values({
        documentType: "WORKSHEET",
        documentId: newId,
        versionNumber: 1,
        content: structuredContent,
        createdBy: user.id,
      });

      // Record audit log
      await tx.insert(auditLogs).values({
        schoolId: user.schoolId,
        userId: user.id,
        action: "CREATE_WORKSHEET",
        entityType: "WORKSHEET",
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

    revalidatePath("/guru/lkpd");
    revalidatePath("/admin/lkpd");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true, id: worksheetId, versionNumber: 1 };
  } catch (err) {
    console.error("Error creating worksheet:", err);
    return {
      success: false,
      error: "Gagal menyimpan LKPD baru. Silakan periksa kembali data Anda.",
    };
  }
}

// 2. Update Worksheet Action (with Transaction, Immutable Version Bump v2, v3...)
export async function updateWorksheetAction(
  worksheetId: string,
  payload: WorksheetInput
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  if (!worksheetId) {
    return { success: false, error: "ID LKPD tidak ditemukan." };
  }

  const parsed = worksheetFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data LKPD tidak valid.",
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

  // Check existing worksheet
  const existingWorksheet = await db
    .select({
      id: worksheets.id,
      teacherId: worksheets.teacherId,
      status: worksheets.status,
    })
    .from(worksheets)
    .where(
      and(
        eq(worksheets.id, worksheetId),
        eq(worksheets.schoolId, user.schoolId),
        eq(worksheets.teacherId, teacher.id),
        isNull(worksheets.deletedAt)
      )
    )
    .limit(1);

  if (!existingWorksheet[0]) {
    return {
      success: false,
      error: "LKPD tidak ditemukan atau Anda tidak memiliki hak akses mengubah dokumen ini.",
    };
  }

  // Build structured JSON content
  const structuredContent: WorksheetContent = {
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
      groupType: data.groupType,
    },
    instructionsAndObjectives: {
      worksheetTitle: data.worksheetTitle,
      generalInstructions: data.generalInstructions,
      activityObjectives: data.activityObjectives,
      prerequisites: data.prerequisites,
      toolsAndMaterials: data.toolsAndMaterials,
      learningSources: data.learningSources,
    },
    briefMaterial: {
      introductoryMaterial: data.introductoryMaterial,
      keyConcepts: data.keyConcepts,
      examplesOrIllustrations: data.examplesOrIllustrations,
      supportingInfo: data.supportingInfo,
    },
    activities: data.activities,
    questions: data.questions,
    assessmentAndRubric: {
      assessmentCriteria: data.assessmentCriteria,
      maxScore: data.maxScore,
      simpleRubric: data.simpleRubric,
      teacherNotes: data.teacherNotes,
    },
    reflection: {
      studentReflection: {
        learned: data.studentReflectLearned,
        understoodMost: data.studentReflectUnderstood,
        difficultParts: data.studentReflectDifficult,
        feeling: data.studentReflectFeeling,
      },
      teacherReflection: {
        activityAchievement: data.teacherReflectAchievement,
        teacherNotes: data.teacherReflectNotes,
        followUp: data.teacherReflectFollowUp,
      },
    },
    attachments: {
      readingMaterials: data.readingMaterials,
      glossary: data.glossary,
      learningSources: data.learningSourcesAttachment,
      additionalNotes: data.additionalNotes,
    },
  };

  try {
    const latestVersion = await db
      .select({ versionNumber: documentVersions.versionNumber })
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentType, "WORKSHEET"),
          eq(documentVersions.documentId, worksheetId)
        )
      )
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (latestVersion[0]?.versionNumber || 0) + 1;

    await db.transaction(async (tx) => {
      // 1. Update worksheets
      await tx
        .update(worksheets)
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
            eq(worksheets.id, worksheetId),
            eq(worksheets.schoolId, user.schoolId),
            eq(worksheets.teacherId, teacher.id)
          )
        );

      // 2. Insert new immutable document version
      await tx.insert(documentVersions).values({
        documentType: "WORKSHEET",
        documentId: worksheetId,
        versionNumber: nextVersionNumber,
        content: structuredContent,
        createdBy: user.id,
      });

      // 3. Record audit log
      await tx.insert(auditLogs).values({
        schoolId: user.schoolId,
        userId: user.id,
        action: "UPDATE_WORKSHEET",
        entityType: "WORKSHEET",
        entityId: worksheetId,
        newData: {
          title: data.title,
          status: data.status,
          version: nextVersionNumber,
        },
      });
    });

    revalidatePath("/guru/lkpd");
    revalidatePath(`/guru/lkpd/${worksheetId}`);
    revalidatePath(`/guru/lkpd/${worksheetId}/preview`);
    revalidatePath("/admin/lkpd");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true, id: worksheetId, versionNumber: nextVersionNumber };
  } catch (err) {
    console.error("Error updating worksheet:", err);
    return {
      success: false,
      error: "Gagal memperbarui LKPD. Silakan coba kembali.",
    };
  }
}

// 3. Publish Worksheet Action
export async function publishWorksheetAction(worksheetId: string): Promise<ActionResponse> {
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
      .update(worksheets)
      .set({
        status: "PUBLISHED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(worksheets.id, worksheetId),
          eq(worksheets.schoolId, user.schoolId),
          eq(worksheets.teacherId, teacher.id),
          isNull(worksheets.deletedAt)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "PUBLISH_WORKSHEET",
      entityType: "WORKSHEET",
      entityId: worksheetId,
      newData: { status: "PUBLISHED" },
    });

    revalidatePath("/guru/lkpd");
    revalidatePath(`/guru/lkpd/${worksheetId}`);
    revalidatePath(`/guru/lkpd/${worksheetId}/preview`);
    revalidatePath("/admin/lkpd");

    return { success: true, id: worksheetId };
  } catch {
    return { success: false, error: "Gagal mempublikasikan LKPD." };
  }
}

// 4. Soft Delete / Deactivate Worksheet Action
export async function deactivateWorksheetAction(worksheetId: string): Promise<ActionResponse> {
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
      .update(worksheets)
      .set({
        deletedAt: new Date(),
        status: "ARCHIVED",
      })
      .where(
        and(
          eq(worksheets.id, worksheetId),
          eq(worksheets.schoolId, user.schoolId),
          eq(worksheets.teacherId, teacher.id)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "DEACTIVATE_WORKSHEET",
      entityType: "WORKSHEET",
      entityId: worksheetId,
    });

    revalidatePath("/guru/lkpd");
    revalidatePath("/admin/lkpd");
    revalidatePath("/guru");
    revalidatePath("/admin");

    return { success: true };
  } catch {
    return { success: false, error: "Gagal menonaktifkan LKPD." };
  }
}
