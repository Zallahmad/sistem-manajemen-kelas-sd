"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { schedules, auditLogs } from "@/db/schema";
import { checkScheduleConflict, DayOfWeek } from "@/lib/data/schedules";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const scheduleSchema = z.object({
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  semesterId: z.string().min(1, "Semester wajib dipilih."),
  dayOfWeek: z.enum(
    ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    { message: "Hari tidak valid." }
  ),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam mulai harus HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam selesai harus HH:mm"),
  teacherId: z.string().min(1, "Guru wajib dipilih."),
  classroomId: z.string().min(1, "Kelas wajib dipilih."),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih."),
  room: z.string().optional().nullable(),
});

export type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function createScheduleAction(
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole("ADMIN");

  const raw = {
    academicYearId: String(formData.get("academicYearId") || ""),
    semesterId: String(formData.get("semesterId") || ""),
    dayOfWeek: String(formData.get("dayOfWeek") || "") as DayOfWeek,
    startTime: String(formData.get("startTime") || "").trim(),
    endTime: String(formData.get("endTime") || "").trim(),
    teacherId: String(formData.get("teacherId") || ""),
    classroomId: String(formData.get("classroomId") || ""),
    subjectId: String(formData.get("subjectId") || ""),
    room: String(formData.get("room") || "").trim() || null,
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input jadwal tidak valid.",
    };
  }

  const {
    academicYearId,
    semesterId,
    dayOfWeek,
    startTime,
    endTime,
    teacherId,
    classroomId,
    subjectId,
    room,
  } = parsed.data;

  // Validate time logic
  if (startTime >= endTime) {
    return {
      success: false,
      error: "Jam mulai harus lebih awal dari jam selesai.",
    };
  }

  // Conflict detection
  const conflict = await checkScheduleConflict({
    schoolId: user.schoolId,
    academicYearId,
    semesterId,
    dayOfWeek,
    startTime,
    endTime,
    teacherId,
    classroomId,
    room,
  });

  if (conflict.hasConflict) {
    return {
      success: false,
      error: conflict.message || "Jadwal bentrok dengan jadwal yang sudah ada.",
    };
  }

  try {
    const res = await db
      .insert(schedules)
      .values({
        schoolId: user.schoolId,
        academicYearId,
        semesterId,
        dayOfWeek,
        startTime,
        endTime,
        teacherId,
        classroomId,
        subjectId,
        room,
      })
      .returning({ id: schedules.id });

    // Audit log
    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "CREATE_SCHEDULE",
      entityType: "SCHEDULE",
      entityId: res[0].id,
      newData: parsed.data,
    });

    revalidatePath("/admin/jadwal");
    revalidatePath("/guru/jadwal");
    revalidatePath("/guru");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan jadwal mengajar.",
    };
  }
}

export async function deactivateScheduleAction(
  scheduleId: string
): Promise<ActionResponse> {
  const user = await requireRole("ADMIN");

  try {
    await db
      .update(schedules)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(schedules.id, scheduleId), eq(schedules.schoolId, user.schoolId))
      );

    await db.insert(auditLogs).values({
      schoolId: user.schoolId,
      userId: user.id,
      action: "DEACTIVATE_SCHEDULE",
      entityType: "SCHEDULE",
      entityId: scheduleId,
    });

    revalidatePath("/admin/jadwal");
    revalidatePath("/guru/jadwal");
    revalidatePath("/guru");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Gagal menonaktifkan jadwal mengajar.",
    };
  }
}
