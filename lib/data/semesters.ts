import { db } from "@/db";
import { semesters, academicYears } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getSemesters(schoolId: string) {
  return db
    .select({
      id: semesters.id,
      academicYearId: semesters.academicYearId,
      academicYearName: academicYears.name,
      name: semesters.name,
      number: semesters.number,
      startDate: semesters.startDate,
      endDate: semesters.endDate,
      isActive: semesters.isActive,
      createdAt: semesters.createdAt,
    })
    .from(semesters)
    .innerJoin(academicYears, eq(semesters.academicYearId, academicYears.id))
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(desc(academicYears.name), desc(semesters.number));
}
