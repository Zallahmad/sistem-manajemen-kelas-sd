import { db } from "@/db";
import { teacherClassAssignments, teachers, classrooms, academicYears } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function getTeacherAssignments(schoolId: string) {
  return db
    .select({
      id: teacherClassAssignments.id,
      teacherId: teacherClassAssignments.teacherId,
      teacherName: teachers.fullName,
      teacherEmail: teachers.email,
      classroomId: teacherClassAssignments.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      academicYearId: teacherClassAssignments.academicYearId,
      academicYearName: academicYears.name,
      isActive: teacherClassAssignments.isActive,
      createdAt: teacherClassAssignments.createdAt,
    })
    .from(teacherClassAssignments)
    .innerJoin(teachers, eq(teacherClassAssignments.teacherId, teachers.id))
    .innerJoin(classrooms, eq(teacherClassAssignments.classroomId, classrooms.id))
    .innerJoin(academicYears, eq(teacherClassAssignments.academicYearId, academicYears.id))
    .where(
      and(
        eq(teachers.schoolId, schoolId),
        isNull(teachers.deletedAt),
        isNull(classrooms.deletedAt)
      )
    )
    .orderBy(desc(teacherClassAssignments.createdAt));
}
