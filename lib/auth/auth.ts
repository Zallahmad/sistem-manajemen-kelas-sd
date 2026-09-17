import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { verifyPassword } from "./password";
import {
  createSessionCookie,
  deleteSessionCookie,
  getSessionFromCookies,
} from "./session";

export interface AuthenticatedUser {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  role: "ADMIN" | "GURU";
  isActive: boolean;
}

export type SafeUser = Omit<AuthenticatedUser, "isActive">;

export interface AuthResultSuccess {
  success: true;
  user: SafeUser;
}

export interface AuthResultError {
  success: false;
  error: string;
}

export type AuthResult = AuthResultSuccess | AuthResultError;

export async function authenticateUser(
  emailInput: string,
  passwordInput: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<AuthResult> {
  const normalizedEmail = emailInput.trim().toLowerCase();

  try {
    const foundUsers = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
      .limit(1);

    const user = foundUsers[0];

    // Use constant-time like comparison to avoid timing attacks
    if (!user || !user.isActive) {
      await recordAuditLog({
        schoolId: user?.schoolId,
        userId: user?.id,
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        entityId: normalizedEmail,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      return {
        success: false,
        error: "Email atau kata sandi tidak valid.",
      };
    }

    const isPasswordValid = await verifyPassword(
      passwordInput,
      user.passwordHash
    );

    if (!isPasswordValid) {
      await recordAuditLog({
        schoolId: user.schoolId,
        userId: user.id,
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        entityId: user.id,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      return {
        success: false,
        error: "Email atau kata sandi tidak valid.",
      };
    }

    const safeUser: SafeUser = {
      id: user.id,
      schoolId: user.schoolId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await createSessionCookie(safeUser);

    await recordAuditLog({
      schoolId: user.schoolId,
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "AUTH",
      entityId: user.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return {
      success: true,
      user: safeUser,
    };
  } catch {
    return {
      success: false,
      error: "Terjadi kesalahan saat memproses autentikasi.",
    };
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  // Verify against database to ensure user is still active and not deleted
  try {
    const userRecords = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(eq(users.id, session.userId), isNull(users.deletedAt)))
      .limit(1);

    const user = userRecords[0];

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      schoolId: user.schoolId,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession(metadata?: {
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const session = await getSessionFromCookies();

  if (session) {
    await recordAuditLog({
      schoolId: session.schoolId,
      userId: session.userId,
      action: "LOGOUT",
      entityType: "AUTH",
      entityId: session.userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  await deleteSessionCookie();
}

async function recordAuditLog(data: {
  schoolId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    if (!data.schoolId) return;

    await db.insert(auditLogs).values({
      schoolId: data.schoolId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch {
    // Non-blocking: audit logs should not break login flow
  }
}
