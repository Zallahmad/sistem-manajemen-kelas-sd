import { db } from "@/db";
import { schools, teachers, students, classrooms, subjects, academicYears, semesters, auditLogs } from "@/db/schema";
import { eq, and, isNull, count, desc } from "drizzle-orm";

export async function getAdminDashboardStats(schoolId: string) {
  const [
    teachersCountRes,
    studentsCountRes,
    classroomsCountRes,
    subjectsCountRes,
    activeAcademicYearRes,
    activeSemesterRes,
    recentAuditsRes,
  ] = await Promise.all([
    db
      .select({ val: count() })
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt))),
    db
      .select({ val: count() })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), isNull(students.deletedAt))),
    db
      .select({ val: count() })
      .from(classrooms)
      .where(and(eq(classrooms.schoolId, schoolId), isNull(classrooms.deletedAt))),
    db
      .select({ val: count() })
      .from(subjects)
      .where(and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt))),
    db
      .select({ id: academicYears.id, name: academicYears.name })
      .from(academicYears)
      .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true)))
      .limit(1),
    db
      .select({ id: semesters.id, name: semesters.name, number: semesters.number })
      .from(semesters)
      .innerJoin(academicYears, eq(semesters.academicYearId, academicYears.id))
      .where(and(eq(academicYears.schoolId, schoolId), eq(semesters.isActive, true)))
      .limit(1),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.schoolId, schoolId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(6),
  ]);

  return {
    totalTeachers: Number(teachersCountRes[0]?.val || 0),
    totalStudents: Number(studentsCountRes[0]?.val || 0),
    totalClassrooms: Number(classroomsCountRes[0]?.val || 0),
    totalSubjects: Number(subjectsCountRes[0]?.val || 0),
    activeAcademicYear: activeAcademicYearRes[0]?.name || "Belum ditentukan",
    activeSemester: activeSemesterRes[0] ? `Semester ${activeSemesterRes[0].name} (${activeSemesterRes[0].number})` : "Belum ditentukan",
    recentAudits: recentAuditsRes,
  };
}

export async function getSchoolData(schoolId: string) {
  const data = await db
    .select()
    .from(schools)
    .where(and(eq(schools.id, schoolId), isNull(schools.deletedAt)))
    .limit(1);

  return data[0] || null;
}
