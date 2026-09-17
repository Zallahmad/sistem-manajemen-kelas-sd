import { db } from "@/db";
import {
  schedules,
  teachers,
  classrooms,
  subjects,
  academicYears,
  semesters,
} from "@/db/schema";
import { eq, and, isNull, ne, count, asc, sql } from "drizzle-orm";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export const DAY_NAMES_ID: Record<DayOfWeek, string> = {
  MONDAY: "Senin",
  TUESDAY: "Selasa",
  WEDNESDAY: "Rabu",
  THURSDAY: "Kamis",
  FRIDAY: "Jumat",
  SATURDAY: "Sabtu",
  SUNDAY: "Minggu",
};

export interface CheckScheduleConflictParams {
  schoolId: string;
  academicYearId: string;
  semesterId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  teacherId: string;
  classroomId: string;
  room?: string | null;
  excludeScheduleId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  message?: string;
}

export async function checkScheduleConflict(
  params: CheckScheduleConflictParams
): Promise<ConflictResult> {
  const {
    schoolId,
    academicYearId,
    semesterId,
    dayOfWeek,
    startTime,
    endTime,
    teacherId,
    classroomId,
    room,
    excludeScheduleId,
  } = params;

  // Base overlap condition: (existing.start < new.end) AND (existing.end > new.start)
  const baseConditions = [
    eq(schedules.schoolId, schoolId),
    eq(schedules.academicYearId, academicYearId),
    eq(schedules.semesterId, semesterId),
    eq(schedules.dayOfWeek, dayOfWeek),
    isNull(schedules.deletedAt),
    sql`${schedules.startTime} < ${endTime} AND ${schedules.endTime} > ${startTime}`,
  ];

  if (excludeScheduleId) {
    baseConditions.push(ne(schedules.id, excludeScheduleId));
  }

  // 1. Check Teacher conflict
  const teacherConflicts = await db
    .select({
      id: schedules.id,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      className: classrooms.name,
      teacherName: teachers.fullName,
    })
    .from(schedules)
    .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
    .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
    .where(and(...baseConditions, eq(schedules.teacherId, teacherId)))
    .limit(1);

  if (teacherConflicts.length > 0) {
    const c = teacherConflicts[0];
    return {
      hasConflict: true,
      message: `Jadwal bentrok dengan jadwal Guru ${c.teacherName} di Kelas ${c.className} (${c.startTime} - ${c.endTime}).`,
    };
  }

  // 2. Check Classroom conflict
  const classroomConflicts = await db
    .select({
      id: schedules.id,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      className: classrooms.name,
      subjectName: subjects.name,
    })
    .from(schedules)
    .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .where(and(...baseConditions, eq(schedules.classroomId, classroomId)))
    .limit(1);

  if (classroomConflicts.length > 0) {
    const c = classroomConflicts[0];
    return {
      hasConflict: true,
      message: `Jadwal bentrok dengan jadwal Kelas ${c.className} untuk mata pelajaran ${c.subjectName} (${c.startTime} - ${c.endTime}).`,
    };
  }

  // 3. Check Room conflict (if room is defined)
  if (room && room.trim() !== "") {
    const roomConflicts = await db
      .select({
        id: schedules.id,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        room: schedules.room,
        className: classrooms.name,
      })
      .from(schedules)
      .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
      .where(and(...baseConditions, eq(schedules.room, room.trim())))
      .limit(1);

    if (roomConflicts.length > 0) {
      const c = roomConflicts[0];
      return {
        hasConflict: true,
        message: `Ruangan "${c.room}" sudah digunakan oleh Kelas ${c.className} pada waktu tersebut (${c.startTime} - ${c.endTime}).`,
      };
    }
  }

  return { hasConflict: false };
}

export interface GetSchedulesFilter {
  schoolId: string;
  dayOfWeek?: DayOfWeek;
  classroomId?: string;
  teacherId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  page?: number;
  pageSize?: number;
}

export async function getSchedules({
  schoolId,
  dayOfWeek,
  classroomId,
  teacherId,
  subjectId,
  academicYearId,
  semesterId,
  page = 1,
  pageSize = 10,
}: GetSchedulesFilter) {
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(schedules.schoolId, schoolId),
    isNull(schedules.deletedAt),
  ];

  if (dayOfWeek) conditions.push(eq(schedules.dayOfWeek, dayOfWeek));
  if (classroomId) conditions.push(eq(schedules.classroomId, classroomId));
  if (teacherId) conditions.push(eq(schedules.teacherId, teacherId));
  if (subjectId) conditions.push(eq(schedules.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(schedules.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(schedules.semesterId, semesterId));

  const whereClause = and(...conditions);

  const [totalRes, items] = await Promise.all([
    db.select({ val: count() }).from(schedules).where(whereClause),
    db
      .select({
        id: schedules.id,
        dayOfWeek: schedules.dayOfWeek,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        room: schedules.room,
        academicYearId: schedules.academicYearId,
        academicYearName: academicYears.name,
        semesterId: schedules.semesterId,
        semesterName: semesters.name,
        semesterNumber: semesters.number,
        classroomId: schedules.classroomId,
        classroomName: classrooms.name,
        gradeLevel: classrooms.gradeLevel,
        teacherId: schedules.teacherId,
        teacherName: teachers.fullName,
        subjectId: schedules.subjectId,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .innerJoin(academicYears, eq(schedules.academicYearId, academicYears.id))
      .innerJoin(semesters, eq(schedules.semesterId, semesters.id))
      .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
      .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
      .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
      .where(whereClause)
      .orderBy(schedules.dayOfWeek, asc(schedules.startTime))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRes[0]?.val || 0);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTeacherWeeklySchedules(teacherUserId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  return db
    .select({
      id: schedules.id,
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      room: schedules.room,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearName: academicYears.name,
      semesterName: semesters.name,
    })
    .from(schedules)
    .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .innerJoin(academicYears, eq(schedules.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(schedules.semesterId, semesters.id))
    .where(
      and(
        eq(schedules.teacherId, teacher.id),
        isNull(schedules.deletedAt)
      )
    )
    .orderBy(schedules.dayOfWeek, asc(schedules.startTime));
}

export function getCurrentDayOfWeekIndonesia(): DayOfWeek {
  const now = new Date();
  // Format day to Asia/Jakarta
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  });
  const weekdayName = dayFormatter.format(now).toUpperCase();

  const map: Record<string, DayOfWeek> = {
    MONDAY: "MONDAY",
    TUESDAY: "TUESDAY",
    WEDNESDAY: "WEDNESDAY",
    THURSDAY: "THURSDAY",
    FRIDAY: "FRIDAY",
    SATURDAY: "SATURDAY",
    SUNDAY: "SUNDAY",
  };

  return map[weekdayName] || "MONDAY";
}

export async function getTeacherTodaySchedules(teacherUserId: string) {
  const todayDayOfWeek = getCurrentDayOfWeekIndonesia();

  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  return db
    .select({
      id: schedules.id,
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      room: schedules.room,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectName: subjects.name,
      subjectCode: subjects.code,
    })
    .from(schedules)
    .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .where(
      and(
        eq(schedules.teacherId, teacher.id),
        eq(schedules.dayOfWeek, todayDayOfWeek),
        isNull(schedules.deletedAt)
      )
    )
    .orderBy(asc(schedules.startTime));
}
