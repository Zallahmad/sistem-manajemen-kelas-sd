import { db } from "@/db";
import { teachers, users } from "@/db/schema";
import { eq, and, isNull, or, ilike, count, desc } from "drizzle-orm";

export interface GetTeachersOptions {
  schoolId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getTeachers({
  schoolId,
  search = "",
  page = 1,
  pageSize = 10,
}: GetTeachersOptions) {
  const offset = (page - 1) * pageSize;

  const baseCondition = and(
    eq(teachers.schoolId, schoolId),
    isNull(teachers.deletedAt)
  );

  const filterCondition = search.trim()
    ? and(
        baseCondition,
        or(
          ilike(teachers.fullName, `%${search.trim()}%`),
          ilike(teachers.employeeNumber, `%${search.trim()}%`),
          ilike(teachers.email, `%${search.trim()}%`)
        )
      )
    : baseCondition;

  const [totalRes, items] = await Promise.all([
    db
      .select({ val: count() })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(filterCondition),
    db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        employeeNumber: teachers.employeeNumber,
        fullName: teachers.fullName,
        gender: teachers.gender,
        birthPlace: teachers.birthPlace,
        birthDate: teachers.birthDate,
        phone: teachers.phone,
        email: teachers.email,
        position: teachers.position,
        isActive: users.isActive,
        createdAt: teachers.createdAt,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(filterCondition)
      .orderBy(desc(teachers.createdAt))
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

export async function getAllActiveTeachersList(schoolId: string) {
  return db
    .select({
      id: teachers.id,
      fullName: teachers.fullName,
      employeeNumber: teachers.employeeNumber,
    })
    .from(teachers)
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(
      and(
        eq(teachers.schoolId, schoolId),
        isNull(teachers.deletedAt),
        eq(users.isActive, true)
      )
    )
    .orderBy(teachers.fullName);
}
