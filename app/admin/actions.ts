"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  schools,
  academicYears,
  semesters,
  users,
  teachers,
  students,
  classrooms,
  subjects,
  teacherClassAssignments,
  auditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Helper for audit
async function logAdminAction(
  schoolId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  data?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      schoolId,
      userId,
      action,
      entityType,
      entityId,
      newData: data ? JSON.parse(JSON.stringify(data)) : null,
    });
  } catch {
    // ignore
  }
}

// =========================================================
// 1. SEKOLAH ACTIONS
// =========================================================
export async function updateSchoolAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const name = String(formData.get("name") || "").trim();
  const npsn = String(formData.get("npsn") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const village = String(formData.get("village") || "").trim() || null;
  const district = String(formData.get("district") || "").trim() || null;
  const regency = String(formData.get("regency") || "").trim() || null;
  const province = String(formData.get("province") || "").trim() || null;
  const postalCode = String(formData.get("postalCode") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;

  if (!name) return;

  try {
    await db
      .update(schools)
      .set({
        name,
        npsn,
        address,
        village,
        district,
        regency,
        province,
        postalCode,
        phone,
        email,
      })
      .where(eq(schools.id, user.schoolId));

    await logAdminAction(user.schoolId, user.id, "UPDATE", "SCHOOL", user.schoolId, { name, npsn });
    revalidatePath("/admin/sekolah");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

// =========================================================
// 2. TAHUN AJARAN ACTIONS
// =========================================================
export async function createAcademicYearAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name || !startDate || !endDate) return;

  try {
    if (isActive) {
      // Deactivate others
      await db
        .update(academicYears)
        .set({ isActive: false })
        .where(eq(academicYears.schoolId, user.schoolId));
    }

    const res = await db
      .insert(academicYears)
      .values({
        schoolId: user.schoolId,
        name,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
      })
      .returning({ id: academicYears.id });

    await logAdminAction(user.schoolId, user.id, "CREATE", "ACADEMIC_YEAR", res[0].id, { name, isActive });
    revalidatePath("/admin/tahun-ajaran");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

export async function toggleAcademicYearActiveAction(id: string, activate: boolean): Promise<void> {
  const user = await requireRole("ADMIN");

  try {
    if (activate) {
      await db
        .update(academicYears)
        .set({ isActive: false })
        .where(eq(academicYears.schoolId, user.schoolId));
    }

    await db
      .update(academicYears)
      .set({ isActive: activate })
      .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, user.schoolId)));

    await logAdminAction(user.schoolId, user.id, "TOGGLE_ACTIVE", "ACADEMIC_YEAR", id, { activate });
    revalidatePath("/admin/tahun-ajaran");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

// =========================================================
// 3. SEMESTER ACTIONS
// =========================================================
export async function createSemesterAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const academicYearId = String(formData.get("academicYearId") || "").trim();
  const name = String(formData.get("name") || "").trim() as "GANJIL" | "GENAP";
  const number = name === "GANJIL" ? 1 : 2;
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!academicYearId || !name || !startDate || !endDate) return;

  try {
    if (isActive) {
      // Deactivate other semesters
      await db
        .update(semesters)
        .set({ isActive: false })
        .where(eq(semesters.academicYearId, academicYearId));
    }

    const res = await db
      .insert(semesters)
      .values({
        academicYearId,
        name,
        number,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
      })
      .returning({ id: semesters.id });

    await logAdminAction(user.schoolId, user.id, "CREATE", "SEMESTER", res[0].id, { name, academicYearId });
    revalidatePath("/admin/semester");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

export async function toggleSemesterActiveAction(id: string, academicYearId: string, activate: boolean): Promise<void> {
  const user = await requireRole("ADMIN");

  try {
    if (activate) {
      await db
        .update(semesters)
        .set({ isActive: false })
        .where(eq(semesters.academicYearId, academicYearId));
    }

    await db
      .update(semesters)
      .set({ isActive: activate })
      .where(eq(semesters.id, id));

    await logAdminAction(user.schoolId, user.id, "TOGGLE_ACTIVE", "SEMESTER", id, { activate });
    revalidatePath("/admin/semester");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

// =========================================================
// 4. GURU (TEACHER) ACTIONS
// =========================================================
export async function createTeacherAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const employeeNumber = String(formData.get("employeeNumber") || "").trim() || null;
  const gender = (formData.get("gender") as "MALE" | "FEMALE") || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const position = String(formData.get("position") || "").trim() || null;

  if (!fullName || !email || !password) return;

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    // 1. Create User
    const newUser = await db
      .insert(users)
      .values({
        schoolId: user.schoolId,
        email,
        name: fullName,
        passwordHash,
        role: "GURU",
        isActive: true,
      })
      .returning({ id: users.id });

    // 2. Create Teacher
    const newTeacher = await db
      .insert(teachers)
      .values({
        schoolId: user.schoolId,
        userId: newUser[0].id,
        fullName,
        email,
        employeeNumber,
        gender,
        phone,
        position,
      })
      .returning({ id: teachers.id });

    await logAdminAction(user.schoolId, user.id, "CREATE", "TEACHER", newTeacher[0].id, { fullName, email });
    revalidatePath("/admin/guru");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

export async function toggleTeacherActiveAction(userId: string, activate: boolean): Promise<void> {
  const user = await requireRole("ADMIN");

  try {
    await db
      .update(users)
      .set({ isActive: activate })
      .where(and(eq(users.id, userId), eq(users.schoolId, user.schoolId)));

    await logAdminAction(user.schoolId, user.id, "TOGGLE_ACTIVE", "USER", userId, { activate });
    revalidatePath("/admin/guru");
  } catch {
    // ignore
  }
}

// =========================================================
// 5. SISWA (STUDENT) ACTIONS
// =========================================================
export async function createStudentAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const fullName = String(formData.get("fullName") || "").trim();
  const nis = String(formData.get("nis") || "").trim() || null;
  const nisn = String(formData.get("nisn") || "").trim() || null;
  const gender = (formData.get("gender") as "MALE" | "FEMALE") || null;
  const birthPlace = String(formData.get("birthPlace") || "").trim() || null;
  const birthDate = String(formData.get("birthDate") || "").trim() || null;
  const religion = String(formData.get("religion") || "").trim() || null;
  const parentName = String(formData.get("parentName") || "").trim() || null;
  const parentPhone = String(formData.get("parentPhone") || "").trim() || null;

  if (!fullName) return;

  try {
    const res = await db
      .insert(students)
      .values({
        schoolId: user.schoolId,
        fullName,
        nis,
        nisn,
        gender,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate).toISOString() : null,
        religion,
        parentName,
        parentPhone,
        isActive: true,
      })
      .returning({ id: students.id });

    await logAdminAction(user.schoolId, user.id, "CREATE", "STUDENT", res[0].id, { fullName, nis, nisn });
    revalidatePath("/admin/siswa");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

export async function softDeleteStudentAction(studentId: string): Promise<void> {
  const user = await requireRole("ADMIN");

  try {
    await db
      .update(students)
      .set({ deletedAt: new Date() })
      .where(and(eq(students.id, studentId), eq(students.schoolId, user.schoolId)));

    await logAdminAction(user.schoolId, user.id, "SOFT_DELETE", "STUDENT", studentId);
    revalidatePath("/admin/siswa");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

// =========================================================
// 6. KELAS (CLASSROOM) ACTIONS
// =========================================================
export async function createClassroomAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const name = String(formData.get("name") || "").trim();
  const gradeLevel = Number(formData.get("gradeLevel") || 1);
  const academicYearId = String(formData.get("academicYearId") || "").trim();
  const homeroomTeacherId = String(formData.get("homeroomTeacherId") || "").trim() || null;
  const capacity = Number(formData.get("capacity") || 30);
  const roomName = String(formData.get("roomName") || "").trim() || null;

  if (!name || !academicYearId) return;

  try {
    const res = await db
      .insert(classrooms)
      .values({
        schoolId: user.schoolId,
        name,
        gradeLevel,
        academicYearId,
        homeroomTeacherId,
        capacity,
        roomName,
      })
      .returning({ id: classrooms.id });

    await logAdminAction(user.schoolId, user.id, "CREATE", "CLASSROOM", res[0].id, { name, gradeLevel });
    revalidatePath("/admin/kelas");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

// =========================================================
// 7. MATA PELAJARAN (SUBJECT) ACTIONS
// =========================================================
export async function createSubjectAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  if (!code || !name) return;

  try {
    const res = await db
      .insert(subjects)
      .values({
        schoolId: user.schoolId,
        code,
        name,
        description,
        isActive: true,
      })
      .returning({ id: subjects.id });

    await logAdminAction(user.schoolId, user.id, "CREATE", "SUBJECT", res[0].id, { code, name });
    revalidatePath("/admin/mata-pelajaran");
    revalidatePath("/admin");
  } catch {
    // ignore
  }
}

// =========================================================
// 8. PENUGASAN GURU (TEACHER CLASS ASSIGNMENTS)
// =========================================================
export async function assignTeacherToClassAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const teacherId = String(formData.get("teacherId") || "").trim();
  const classroomId = String(formData.get("classroomId") || "").trim();
  const academicYearId = String(formData.get("academicYearId") || "").trim();

  if (!teacherId || !classroomId || !academicYearId) return;

  try {
    const res = await db
      .insert(teacherClassAssignments)
      .values({
        teacherId,
        classroomId,
        academicYearId,
        isActive: true,
      })
      .returning({ id: teacherClassAssignments.id });

    await logAdminAction(user.schoolId, user.id, "ASSIGN", "TEACHER_CLASS", res[0].id, { teacherId, classroomId });
    revalidatePath("/admin/penugasan-guru");
  } catch {
    // ignore
  }
}

export async function removeTeacherAssignmentAction(assignmentId: string): Promise<void> {
  const user = await requireRole("ADMIN");

  try {
    await db
      .delete(teacherClassAssignments)
      .where(eq(teacherClassAssignments.id, assignmentId));

    await logAdminAction(user.schoolId, user.id, "REMOVE_ASSIGN", "TEACHER_CLASS", assignmentId);
    revalidatePath("/admin/penugasan-guru");
  } catch {
    // ignore
  }
}
