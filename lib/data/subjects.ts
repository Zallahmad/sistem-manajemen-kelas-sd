import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq, and, isNull, or, ilike, desc } from "drizzle-orm";

export async function getSubjects(schoolId: string, search = "") {
  const baseCondition = and(
    eq(subjects.schoolId, schoolId),
    isNull(subjects.deletedAt)
  );

  const filterCondition = search.trim()
    ? and(
        baseCondition,
        or(
          ilike(subjects.name, `%${search.trim()}%`),
          ilike(subjects.code, `%${search.trim()}%`)
        )
      )
    : baseCondition;

  return db
    .select()
    .from(subjects)
    .where(filterCondition)
    .orderBy(desc(subjects.createdAt));
}
