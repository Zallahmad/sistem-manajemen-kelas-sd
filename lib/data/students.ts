import { db } from "@/db";
import { students } from "@/db/schema";
import { eq, and, isNull, or, ilike, count, desc } from "drizzle-orm";

export interface GetStudentsOptions {
  schoolId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getStudents({
  schoolId,
  search = "",
  page = 1,
  pageSize = 10,
}: GetStudentsOptions) {
  const offset = (page - 1) * pageSize;

  const baseCondition = and(
    eq(students.schoolId, schoolId),
    isNull(students.deletedAt)
  );

  const filterCondition = search.trim()
    ? and(
        baseCondition,
        or(
          ilike(students.fullName, `%${search.trim()}%`),
          ilike(students.nis, `%${search.trim()}%`),
          ilike(students.nisn, `%${search.trim()}%`)
        )
      )
    : baseCondition;

  const [totalRes, items] = await Promise.all([
    db.select({ val: count() }).from(students).where(filterCondition),
    db
      .select()
      .from(students)
      .where(filterCondition)
      .orderBy(desc(students.createdAt))
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
