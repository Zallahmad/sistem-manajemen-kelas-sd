"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  assessments,
  grades,
  teachers,
  teacherClassAssignments,
  studentClassEnrollments,
  auditLogs,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { AssessmentType } from "@/lib/data/grades";

// 1. Validation Schema for creating Assessment
const createAssessmentSchema = z.object({
  name: z.string().min(1, "Judul penilaian wajib diisi."),
  type: z.enum([
    "DAILY",
    "QUIZ",
    "MIDTERM",
    "FINAL",
    "PROJECT",
    "ASSIGNMENT",
    "PRACTICAL",
  ]),
  classroomId: z.string().min(1, "Kelas wajib dipilih."),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih."),
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  semesterId: z.string().min(1, "Semester wajib dipilih."),
  assessmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)."),
  maxScore: z
    .number({ message: "Nilai maksimal harus berupa angka." })
    .positive("Nilai maksimal harus lebih besar dari 0.")
    .max(1000, "Nilai maksimal terlalu besar."),
  description: z.string().optional().nullable(),
});

export type ActionResponse = {
  success: boolean;
  error?: string;
  id?: string;
};

export async function createAssessmentAction(
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const raw = {
    name: String(formData.get("name") || "").trim(),
    type: String(formData.get("type") || "DAILY") as AssessmentType,
    classroomId: String(formData.get("classroomId") || ""),
    subjectId: String(formData.get("subjectId") || ""),
    academicYearId: String(formData.get("academicYearId") || ""),
    semesterId: String(formData.get("semesterId") || ""),
    assessmentDate: String(formData.get("assessmentDate") || "").trim(),
    maxScore: Number(formData.get("maxScore") || 100),
    description: String(formData.get("description") || "").trim() || null,
  };

  const parsed = createAssessmentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input penilaian tidak valid.",
    };
  }

  // 1. Get teacher profile
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, user.id), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return { success: false, error: "Profil guru tidak ditemukan." };
  }

  // 2. Verify teacher has assignment access to classroom
  const assignment = await db
    .select({ id: teacherClassAssignments.id })
    .from(teacherClassAssignments)
    .where(
      and(
        eq(teacherClassAssignments.teacherId, teacher.id),
        eq(teacherClassAssignments.classroomId, parsed.data.classroomId),
        eq(teacherClassAssignments.isActive, true)
      )
    )
    .limit(1);

  if (assignment.length === 0) {
    return {
      success: false,
      error: "Anda tidak memiliki akses penugasan pada kelas ini.",
    };
  }

  const assessmentDateObj = new Date(parsed.data.assessmentDate + "T00:00:00Z").toISOString();

  try {
    const res = await db
      .insert(assessments)
      .values({
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        classroomId: parsed.data.classroomId,
        subjectId: parsed.data.subjectId,
        academicYearId: parsed.data.academicYearId,
        semesterId: parsed.data.semesterId,
        name: parsed.data.name,
        type: parsed.data.type,
        assessmentDate: assessmentDateObj,
        maxScore: String(parsed.data.maxScore),
        description: parsed.data.description,
      })
      .returning({ id: assessments.id });

    // Audit log
    await db.insert(auditLogs).values({
      schoolId: teacher.schoolId,
      userId: user.id,
      action: "CREATE_ASSESSMENT",
      entityType: "ASSESSMENT",
      entityId: res[0].id,
      newData: parsed.data,
    });

    revalidatePath("/guru/nilai");
    revalidatePath("/admin/nilai");
    revalidatePath("/guru");

    return { success: true, id: res[0].id };
  } catch {
    return {
      success: false,
      error: "Terjadi kesalahan saat membuat komponen penilaian.",
    };
  }
}

// 2. Validation schema for Bulk Save Grades
const saveGradesSchema = z.object({
  assessmentId: z.string().min(1),
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      score: z.number().min(0, "Nilai tidak boleh negatif."),
      notes: z.string().optional().nullable(),
    })
  ),
});

export async function saveGradesAction(
  payload: z.infer<typeof saveGradesSchema>
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const parsed = saveGradesSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Format nilai tidak valid.",
    };
  }

  const { assessmentId, grades: gradeItems } = parsed.data;

  // 1. Get teacher
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, user.id), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return { success: false, error: "Profil guru tidak ditemukan." };
  }

  // 2. Verify assessment ownership
  const assessmentRecord = await db
    .select({
      id: assessments.id,
      classroomId: assessments.classroomId,
      maxScore: assessments.maxScore,
      schoolId: assessments.schoolId,
    })
    .from(assessments)
    .where(
      and(
        eq(assessments.id, assessmentId),
        eq(assessments.teacherId, teacher.id),
        eq(assessments.schoolId, teacher.schoolId),
        isNull(assessments.deletedAt)
      )
    )
    .limit(1);

  const assessment = assessmentRecord[0];
  if (!assessment) {
    return {
      success: false,
      error: "Penilaian tidak ditemukan atau tidak diampu oleh Anda.",
    };
  }

  const maxScore = Number(assessment.maxScore);

  // 3. Verify enrolled students
  const enrolledStudents = await db
    .select({ studentId: studentClassEnrollments.studentId })
    .from(studentClassEnrollments)
    .where(
      and(
        eq(studentClassEnrollments.classroomId, assessment.classroomId),
        eq(studentClassEnrollments.status, "ACTIVE")
      )
    );

  const enrolledIdSet = new Set(enrolledStudents.map((e) => e.studentId));

  for (const g of gradeItems) {
    if (!enrolledIdSet.has(g.studentId)) {
      return {
        success: false,
        error: "Terdapat siswa yang tidak terdaftar di kelas penilaian ini.",
      };
    }
    if (g.score > maxScore) {
      return {
        success: false,
        error: `Nilai (${g.score}) tidak boleh melebihi nilai maksimal (${maxScore}).`,
      };
    }
  }

  try {
    // 4. Atomic upsert grades
    // Clear and insert or update
    await db.delete(grades).where(eq(grades.assessmentId, assessmentId));

    if (gradeItems.length > 0) {
      await db.insert(grades).values(
        gradeItems.map((g) => ({
          assessmentId,
          studentId: g.studentId,
          score: String(g.score),
          notes: g.notes || null,
        }))
      );
    }

    // Audit log
    await db.insert(auditLogs).values({
      schoolId: teacher.schoolId,
      userId: user.id,
      action: "SAVE_GRADES",
      entityType: "GRADES",
      entityId: assessmentId,
      newData: { totalGrades: gradeItems.length },
    });

    revalidatePath(`/guru/nilai`);
    revalidatePath(`/guru/nilai/${assessmentId}`);
    revalidatePath(`/guru/nilai/${assessmentId}/rekap`);
    revalidatePath(`/admin/nilai`);
    revalidatePath(`/guru`);

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan nilai siswa.",
    };
  }
}

// 3. Deactivate Assessment
export async function deactivateAssessmentAction(
  assessmentId: string
): Promise<ActionResponse> {
  const user = await requireRole("GURU");

  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, user.id), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return { success: false, error: "Profil guru tidak ditemukan." };

  try {
    await db
      .update(assessments)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(assessments.id, assessmentId),
          eq(assessments.teacherId, teacher.id),
          eq(assessments.schoolId, teacher.schoolId)
        )
      );

    await db.insert(auditLogs).values({
      schoolId: teacher.schoolId,
      userId: user.id,
      action: "DEACTIVATE_ASSESSMENT",
      entityType: "ASSESSMENT",
      entityId: assessmentId,
    });

    revalidatePath("/guru/nilai");
    revalidatePath("/admin/nilai");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus penilaian." };
  }
}
