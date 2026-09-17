import { db } from "@/db";
import {
  teachers,
  teacherClassAssignments,
  classrooms,
  academicYears,
  studentClassEnrollments,
  students,
} from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";

export async function getGuruDashboardData(userId: string) {
  const teacherRecord = await db
    .select()
    .from(teachers)
    .where(and(eq(teachers.userId, userId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return {
      teacher: null,
      assignedClassrooms: [],
      totalStudentsCount: 0,
    };
  }

  // Get active assigned classrooms
  const assignedClassrooms = await db
    .select({
      assignmentId: teacherClassAssignments.id,
      classroomId: classrooms.id,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      roomName: classrooms.roomName,
      academicYearName: academicYears.name,
    })
    .from(teacherClassAssignments)
    .innerJoin(classrooms, eq(teacherClassAssignments.classroomId, classrooms.id))
    .innerJoin(academicYears, eq(teacherClassAssignments.academicYearId, academicYears.id))
    .where(
      and(
        eq(teacherClassAssignments.teacherId, teacher.id),
        eq(teacherClassAssignments.isActive, true),
        isNull(classrooms.deletedAt)
      )
    );

  const classroomIds = assignedClassrooms.map((c) => c.classroomId);

  let totalStudentsCount = 0;
  if (classroomIds.length > 0) {
    const studentsCountRes = await db
      .select({ val: count(studentClassEnrollments.studentId) })
      .from(studentClassEnrollments)
      .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
      .where(
        and(
          eq(studentClassEnrollments.status, "ACTIVE"),
          isNull(students.deletedAt)
        )
      );

    totalStudentsCount = Number(studentsCountRes[0]?.val || 0);
  }

  return {
    teacher,
    assignedClassrooms,
    totalStudentsCount,
  };
}

export async function getGuruAssignedClassrooms(userId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, userId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  return db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      roomName: classrooms.roomName,
      capacity: classrooms.capacity,
      academicYearName: academicYears.name,
    })
    .from(teacherClassAssignments)
    .innerJoin(classrooms, eq(teacherClassAssignments.classroomId, classrooms.id))
    .innerJoin(academicYears, eq(teacherClassAssignments.academicYearId, academicYears.id))
    .where(
      and(
        eq(teacherClassAssignments.teacherId, teacher.id),
        eq(teacherClassAssignments.isActive, true),
        isNull(classrooms.deletedAt)
      )
    )
    .orderBy(classrooms.gradeLevel, classrooms.name);
}

export async function getGuruStudents(userId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, userId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  return db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      nis: students.nis,
      nisn: students.nisn,
      gender: students.gender,
      className: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      academicYearName: academicYears.name,
    })
    .from(teacherClassAssignments)
    .innerJoin(classrooms, eq(teacherClassAssignments.classroomId, classrooms.id))
    .innerJoin(academicYears, eq(teacherClassAssignments.academicYearId, academicYears.id))
    .innerJoin(studentClassEnrollments, eq(studentClassEnrollments.classroomId, classrooms.id))
    .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
    .where(
      and(
        eq(teacherClassAssignments.teacherId, teacher.id),
        eq(teacherClassAssignments.isActive, true),
        eq(studentClassEnrollments.status, "ACTIVE"),
        isNull(classrooms.deletedAt),
        isNull(students.deletedAt)
      )
    )
    .orderBy(classrooms.gradeLevel, classrooms.name, students.fullName);
}
