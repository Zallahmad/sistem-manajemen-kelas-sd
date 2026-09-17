import { db } from "@/db";
import {
  attendance,
  attendanceRecords,
  schedules,
  classrooms,
  subjects,
  teachers,
  students,
  studentClassEnrollments,
  academicYears,
} from "@/db/schema";
import { eq, and, isNull, desc, count } from "drizzle-orm";

export type AttendanceStatus =
  | "PRESENT"
  | "SICK"
  | "PERMISSION"
  | "ABSENT"
  | "LATE";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "HADIR",
  SICK: "SAKIT",
  PERMISSION: "IZIN",
  ABSENT: "ALPA",
  LATE: "TERLAMBAT",
};

export function getTodayDateJakarta(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // YYYY-MM-DD
}

// 1. Get teacher's available schedules for attendance (with status whether already recorded for given date)
export async function getTeacherAttendanceSchedules(
  teacherUserId: string,
  dateStr: string = getTodayDateJakarta()
) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  // Query schedules
  const teacherSchedules = await db
    .select({
      id: schedules.id,
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      room: schedules.room,
      classroomId: schedules.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: schedules.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearName: academicYears.name,
    })
    .from(schedules)
    .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .innerJoin(academicYears, eq(schedules.academicYearId, academicYears.id))
    .where(
      and(
        eq(schedules.teacherId, teacher.id),
        isNull(schedules.deletedAt)
      )
    )
    .orderBy(schedules.dayOfWeek, schedules.startTime);

  // Check which classrooms have attendance recorded on dateStr
  const attendanceDateObj = new Date(dateStr + "T00:00:00Z").toISOString();
  const existingAttendances = await db
    .select({
      id: attendance.id,
      classroomId: attendance.classroomId,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.teacherId, teacher.id),
        eq(attendance.attendanceDate, attendanceDateObj)
      )
    );

  const recordedClassroomMap = new Map(
    existingAttendances.map((a) => [a.classroomId, a.id])
  );

  return teacherSchedules.map((s) => ({
    ...s,
    attendanceId: recordedClassroomMap.get(s.classroomId) || null,
    isRecorded: recordedClassroomMap.has(s.classroomId),
  }));
}

// 2. Get schedule detail and active students for taking attendance
export async function getAttendanceSessionData(
  scheduleId: string,
  teacherUserId: string,
  dateStr: string = getTodayDateJakarta()
) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return null;

  // Verify schedule ownership
  const scheduleRecord = await db
    .select({
      id: schedules.id,
      schoolId: schedules.schoolId,
      classroomId: schedules.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: schedules.subjectId,
      subjectName: subjects.name,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      dayOfWeek: schedules.dayOfWeek,
      academicYearName: academicYears.name,
    })
    .from(schedules)
    .innerJoin(classrooms, eq(schedules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .innerJoin(academicYears, eq(schedules.academicYearId, academicYears.id))
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
  if (!schedule) return null;

  // Active enrolled students
  const activeStudents = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      nis: students.nis,
      nisn: students.nisn,
      gender: students.gender,
    })
    .from(studentClassEnrollments)
    .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
    .where(
      and(
        eq(studentClassEnrollments.classroomId, schedule.classroomId),
        eq(studentClassEnrollments.status, "ACTIVE"),
        eq(students.schoolId, teacher.schoolId),
        isNull(students.deletedAt)
      )
    )
    .orderBy(students.fullName);

  // Check if attendance already exists for this classroom and date
  const attendanceDateObj = new Date(dateStr + "T00:00:00Z").toISOString();
  const existingAttendance = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.classroomId, schedule.classroomId),
        eq(attendance.attendanceDate, attendanceDateObj)
      )
    )
    .limit(1);

  let existingRecordsMap: Record<string, { status: AttendanceStatus; notes: string | null }> = {};

  if (existingAttendance.length > 0) {
    const records = await db
      .select({
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
        notes: attendanceRecords.notes,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.attendanceId, existingAttendance[0].id));

    existingRecordsMap = records.reduce((acc, curr) => {
      acc[curr.studentId] = {
        status: curr.status as AttendanceStatus,
        notes: curr.notes,
      };
      return acc;
    }, {} as Record<string, { status: AttendanceStatus; notes: string | null }>);
  }

  return {
    schedule,
    teacherId: teacher.id,
    schoolId: teacher.schoolId,
    dateStr,
    existingAttendanceId: existingAttendance[0]?.id || null,
    existingNotes: existingAttendance[0]?.notes || "",
    students: activeStudents.map((st) => ({
      ...st,
      status: existingRecordsMap[st.studentId]?.status || "PRESENT",
      notes: existingRecordsMap[st.studentId]?.notes || "",
    })),
  };
}

// 3. Teacher attendance history
export async function getTeacherAttendanceHistory(
  teacherUserId: string,
  classroomId?: string
) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  const conditions = [
    eq(attendance.teacherId, teacher.id),
  ];
  if (classroomId) conditions.push(eq(attendance.classroomId, classroomId));

  const attendancesList = await db
    .select({
      id: attendance.id,
      attendanceDate: attendance.attendanceDate,
      notes: attendance.notes,
      classroomId: attendance.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      createdAt: attendance.createdAt,
    })
    .from(attendance)
    .innerJoin(classrooms, eq(attendance.classroomId, classrooms.id))
    .where(and(...conditions))
    .orderBy(desc(attendance.attendanceDate), desc(attendance.createdAt));

  // Get statistics for each attendance record
  const result = await Promise.all(
    attendancesList.map(async (item) => {
      const records = await db
        .select({
          status: attendanceRecords.status,
          total: count(),
        })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.attendanceId, item.id))
        .groupBy(attendanceRecords.status);

      const stats = {
        total: 0,
        present: 0,
        sick: 0,
        permission: 0,
        absent: 0,
        late: 0,
      };

      for (const r of records) {
        const val = Number(r.total);
        stats.total += val;
        if (r.status === "PRESENT") stats.present = val;
        if (r.status === "SICK") stats.sick = val;
        if (r.status === "PERMISSION") stats.permission = val;
        if (r.status === "ABSENT") stats.absent = val;
        if (r.status === "LATE") stats.late = val;
      }

      return {
        ...item,
        stats,
      };
    })
  );

  return result;
}

// 4. Admin summary of attendance across school
export async function getAdminAttendanceSummary(
  schoolId: string,
  filter?: {
    date?: string;
    classroomId?: string;
    teacherId?: string;
  }
) {
  const conditions = [eq(attendance.schoolId, schoolId)];

  if (filter?.date) {
    const dObj = new Date(filter.date + "T00:00:00Z").toISOString();
    conditions.push(eq(attendance.attendanceDate, dObj));
  }
  if (filter?.classroomId) conditions.push(eq(attendance.classroomId, filter.classroomId));
  if (filter?.teacherId) conditions.push(eq(attendance.teacherId, filter.teacherId));

  const list = await db
    .select({
      id: attendance.id,
      attendanceDate: attendance.attendanceDate,
      notes: attendance.notes,
      classroomId: attendance.classroomId,
      classroomName: classrooms.name,
      teacherId: attendance.teacherId,
      teacherName: teachers.fullName,
      createdAt: attendance.createdAt,
    })
    .from(attendance)
    .innerJoin(classrooms, eq(attendance.classroomId, classrooms.id))
    .innerJoin(teachers, eq(attendance.teacherId, teachers.id))
    .where(and(...conditions))
    .orderBy(desc(attendance.attendanceDate))
    .limit(50);

  const detailed = await Promise.all(
    list.map(async (item) => {
      const records = await db
        .select({
          status: attendanceRecords.status,
          total: count(),
        })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.attendanceId, item.id))
        .groupBy(attendanceRecords.status);

      const stats = {
        total: 0,
        present: 0,
        sick: 0,
        permission: 0,
        absent: 0,
        late: 0,
      };

      for (const r of records) {
        const val = Number(r.total);
        stats.total += val;
        if (r.status === "PRESENT") stats.present = val;
        if (r.status === "SICK") stats.sick = val;
        if (r.status === "PERMISSION") stats.permission = val;
        if (r.status === "ABSENT") stats.absent = val;
        if (r.status === "LATE") stats.late = val;
      }

      const percent =
        stats.total > 0
          ? Math.round(((stats.present + stats.late) / stats.total) * 100)
          : 0;

      return {
        ...item,
        stats,
        percentage: percent,
      };
    })
  );

  return detailed;
}

// 5. Admin Classroom Attendance Aggregation
export async function getAdminClassroomRecap(schoolId: string) {
  const classroomsList = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      academicYearName: academicYears.name,
    })
    .from(classrooms)
    .innerJoin(academicYears, eq(classrooms.academicYearId, academicYears.id))
    .where(and(eq(classrooms.schoolId, schoolId), isNull(classrooms.deletedAt)))
    .orderBy(classrooms.gradeLevel, classrooms.name);

  const recap = await Promise.all(
    classroomsList.map(async (c) => {
      const agg = await db
        .select({
          status: attendanceRecords.status,
          total: count(),
        })
        .from(attendanceRecords)
        .innerJoin(attendance, eq(attendanceRecords.attendanceId, attendance.id))
        .where(and(eq(attendance.classroomId, c.id), eq(attendance.schoolId, schoolId)))
        .groupBy(attendanceRecords.status);

      let total = 0;
      let present = 0;
      let sick = 0;
      let permission = 0;
      let absent = 0;
      let late = 0;

      for (const a of agg) {
        const cnt = Number(a.total);
        total += cnt;
        if (a.status === "PRESENT") present += cnt;
        if (a.status === "SICK") sick += cnt;
        if (a.status === "PERMISSION") permission += cnt;
        if (a.status === "ABSENT") absent += cnt;
        if (a.status === "LATE") late += cnt;
      }

      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        ...c,
        totalRecords: total,
        present,
        sick,
        permission,
        absent,
        late,
        percentage,
      };
    })
  );

  return recap;
}

// 6. Admin Student Attendance Aggregation
export async function getAdminStudentRecap(
  schoolId: string,
  classroomId?: string
) {
  const conditions = [
    eq(students.schoolId, schoolId),
    isNull(students.deletedAt),
  ];

  if (classroomId) {
    conditions.push(eq(studentClassEnrollments.classroomId, classroomId));
    conditions.push(eq(studentClassEnrollments.status, "ACTIVE"));
  }

  const studentList = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      nis: students.nis,
      gender: students.gender,
      className: classrooms.name,
    })
    .from(students)
    .leftJoin(studentClassEnrollments, eq(students.id, studentClassEnrollments.studentId))
    .leftJoin(classrooms, eq(studentClassEnrollments.classroomId, classrooms.id))
    .where(and(...conditions))
    .orderBy(students.fullName)
    .limit(100);

  const recap = await Promise.all(
    studentList.map(async (s) => {
      const agg = await db
        .select({
          status: attendanceRecords.status,
          total: count(),
        })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.studentId, s.id))
        .groupBy(attendanceRecords.status);

      let total = 0;
      let present = 0;
      let sick = 0;
      let permission = 0;
      let absent = 0;
      let late = 0;

      for (const a of agg) {
        const cnt = Number(a.total);
        total += cnt;
        if (a.status === "PRESENT") present += cnt;
        if (a.status === "SICK") sick += cnt;
        if (a.status === "PERMISSION") permission += cnt;
        if (a.status === "ABSENT") absent += cnt;
        if (a.status === "LATE") late += cnt;
      }

      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        ...s,
        total,
        present,
        sick,
        permission,
        absent,
        late,
        percentage,
      };
    })
  );

  return recap;
}
