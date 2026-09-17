"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import {
  attendance,
  attendanceRecords,
  teachers,
  schedules,
  studentClassEnrollments,
  auditLogs,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { AttendanceStatus } from "@/lib/data/attendance";

const saveAttendanceSchema = z.object({
  scheduleId: z.string().min(1, "ID Jadwal wajib ada."),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)."),
  notes: z.string().optional().nullable(),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "SICK", "PERMISSION", "ABSENT", "LATE"]),
      notes: z.string().optional().nullable(),
    })
  ).min(1, "Daftar absensi siswa tidak boleh kosong."),
});

export type AttendanceActionResult = {
  success: boolean;
  error?: string;
};

export async function saveAttendanceAction(
  payload: z.infer<typeof saveAttendanceSchema>
): Promise<AttendanceActionResult> {
  const user = await requireRole("GURU");

  const parsed = saveAttendanceSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input data absensi tidak valid.",
    };
  }

  const { scheduleId, attendanceDate, notes, records } = parsed.data;

  // 1. Get teacher record
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, user.id), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return {
      success: false,
      error: "Data profil guru tidak ditemukan.",
    };
  }

  // 2. Validate schedule ownership & school isolation
  const scheduleRecord = await db
    .select({
      id: schedules.id,
      classroomId: schedules.classroomId,
      schoolId: schedules.schoolId,
    })
    .from(schedules)
    .where(
      and(
        eq(schedules.id, scheduleId),
        eq(schedules.teacherId, teacher.id),
        eq(schedules.schoolId, teacher.schoolId),
        isNull(schedules.deletedAt)
      )
    )
    .limit(1);

  const schedule = scheduleRecord[0];
  if (!schedule) {
    return {
      success: false,
      error: "Jadwal ini tidak terdaftar atas nama Anda atau sudah tidak aktif.",
    };
  }

  // 3. Validate enrolled active students in classroom
  const enrolledStudents = await db
    .select({ studentId: studentClassEnrollments.studentId })
    .from(studentClassEnrollments)
    .where(
      and(
        eq(studentClassEnrollments.classroomId, schedule.classroomId),
        eq(studentClassEnrollments.status, "ACTIVE")
      )
    );

  const enrolledStudentIdSet = new Set(enrolledStudents.map((e) => e.studentId));

  for (const r of records) {
    if (!enrolledStudentIdSet.has(r.studentId)) {
      return {
        success: false,
        error: "Terdapat siswa yang tidak aktif atau tidak terdaftar di kelas ini.",
      };
    }
  }

  const attendanceDateObj = new Date(attendanceDate + "T00:00:00Z").toISOString();

  try {
    // 4. Save or Update Attendance Header & Records
    // Check if attendance already exists
    const existing = await db
      .select({ id: attendance.id })
      .from(attendance)
      .where(
        and(
          eq(attendance.classroomId, schedule.classroomId),
          eq(attendance.attendanceDate, attendanceDateObj)
        )
      )
      .limit(1);

    let attendanceId: string;
    let isUpdate = false;

    if (existing.length > 0) {
      attendanceId = existing[0].id;
      isUpdate = true;

      // Update notes
      await db
        .update(attendance)
        .set({
          notes: notes || null,
          teacherId: teacher.id,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, attendanceId));

      // Remove existing sub-records to prevent duplicate constraint violation
      await db
        .delete(attendanceRecords)
        .where(eq(attendanceRecords.attendanceId, attendanceId));
    } else {
      const newAttendance = await db
        .insert(attendance)
        .values({
          schoolId: teacher.schoolId,
          classroomId: schedule.classroomId,
          teacherId: teacher.id,
          attendanceDate: attendanceDateObj,
          notes: notes || null,
        })
        .returning({ id: attendance.id });

      attendanceId = newAttendance[0].id;
    }

    // Insert records
    await db.insert(attendanceRecords).values(
      records.map((r) => ({
        attendanceId,
        studentId: r.studentId,
        status: r.status as AttendanceStatus,
        notes: r.notes || null,
      }))
    );

    // Audit log
    await db.insert(auditLogs).values({
      schoolId: teacher.schoolId,
      userId: user.id,
      action: isUpdate ? "UPDATE_ATTENDANCE" : "CREATE_ATTENDANCE",
      entityType: "ATTENDANCE",
      entityId: attendanceId,
      newData: {
        classroomId: schedule.classroomId,
        date: attendanceDate,
        totalRecords: records.length,
      },
    });

    revalidatePath("/guru/absensi");
    revalidatePath("/guru/absensi/riwayat");
    revalidatePath("/guru");
    revalidatePath("/admin/absensi");

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan presensi siswa ke basis data.",
    };
  }
}
