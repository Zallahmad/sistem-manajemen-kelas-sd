import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser, SafeUser } from "./auth";
import { db } from "@/db";
import { teacherClassAssignments, teachers } from "@/db/schema";

export type Role = "ADMIN" | "GURU";

export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(expectedRole: Role): Promise<SafeUser> {
  const user = await requireAuth();

  if (user.role !== expectedRole) {
    if (user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/guru");
    }
  }

  return user;
}

export async function requireTeacherClassAccess(
  teacherUserId: string,
  classroomId: string
): Promise<boolean> {
  try {
    const teacherRecords = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
      .limit(1);

    const teacher = teacherRecords[0];
    if (!teacher) {
      return false;
    }

    const assignments = await db
      .select({ id: teacherClassAssignments.id })
      .from(teacherClassAssignments)
      .where(
        and(
          eq(teacherClassAssignments.teacherId, teacher.id),
          eq(teacherClassAssignments.classroomId, classroomId),
          eq(teacherClassAssignments.isActive, true)
        )
      )
      .limit(1);

    return assignments.length > 0;
  } catch {
    return false;
  }
}
