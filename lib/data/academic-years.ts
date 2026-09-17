import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getAcademicYears(schoolId: string) {
  return db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(desc(academicYears.createdAt));
}

export async function getActiveAcademicYear(schoolId: string) {
  const result = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true)))
    .limit(1);

  return result[0] || null;
}
