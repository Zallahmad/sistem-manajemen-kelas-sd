import { db } from "@/db";
import { classrooms, academicYears, teachers, studentClassEnrollments, students } from "@/db/schema";
import { eq, and, isNull, or, ilike, desc } from "drizzle-orm";

export async function getClassrooms(schoolId: string, search = "") {
  const baseCondition = and(
    eq(classrooms.schoolId, schoolId),
    isNull(classrooms.deletedAt)
  );

  const filterCondition = search.trim()
    ? and(
        baseCondition,
        or(
          ilike(classrooms.name, `%${search.trim()}%`),
          ilike(classrooms.roomName, `%${search.trim()}%`)
        )
      )
    : baseCondition;

  return db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      roomName: classrooms.roomName,
      capacity: classrooms.capacity,
      academicYearId: classrooms.academicYearId,
      academicYearName: academicYears.name,
      homeroomTeacherId: classrooms.homeroomTeacherId,
      homeroomTeacherName: teachers.fullName,
      createdAt: classrooms.createdAt,
    })
    .from(classrooms)
    .innerJoin(academicYears, eq(classrooms.academicYearId, academicYears.id))
    .leftJoin(teachers, eq(classrooms.homeroomTeacherId, teachers.id))
    .where(filterCondition)
    .orderBy(desc(academicYears.name), classrooms.gradeLevel, classrooms.name);
}

export async function getClassroomById(classroomId: string, schoolId: string) {
  const result = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      roomName: classrooms.roomName,
      capacity: classrooms.capacity,
      academicYearId: classrooms.academicYearId,
      academicYearName: academicYears.name,
      homeroomTeacherId: classrooms.homeroomTeacherId,
      homeroomTeacherName: teachers.fullName,
    })
    .from(classrooms)
    .innerJoin(academicYears, eq(classrooms.academicYearId, academicYears.id))
    .leftJoin(teachers, eq(classrooms.homeroomTeacherId, teachers.id))
    .where(
      and(
        eq(classrooms.id, classroomId),
        eq(classrooms.schoolId, schoolId),
        isNull(classrooms.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function getClassroomStudents(classroomId: string) {
  return db
    .select({
      enrollmentId: studentClassEnrollments.id,
      studentId: students.id,
      nis: students.nis,
      nisn: students.nisn,
      fullName: students.fullName,
      gender: students.gender,
      status: studentClassEnrollments.status,
      enrolledAt: studentClassEnrollments.enrolledAt,
    })
    .from(studentClassEnrollments)
    .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
    .where(
      and(
        eq(studentClassEnrollments.classroomId, classroomId),
        eq(studentClassEnrollments.status, "ACTIVE"),
        isNull(students.deletedAt)
      )
    )
    .orderBy(students.fullName);
}
