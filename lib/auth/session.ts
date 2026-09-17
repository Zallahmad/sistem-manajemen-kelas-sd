import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  schoolId: string;
  role: "ADMIN" | "GURU";
  name: string;
  email: string;
  expiresAt: string;
}

const DEFAULT_SESSION_SECRET = "default_jwt_secret_change_in_production_min_32_chars";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
  return new TextEncoder().encode(secret);
}

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function encryptSession(payload: Omit<SessionPayload, "expiresAt">): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const secret = getSecretKey();

  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function decryptSession(sessionToken?: string): Promise<SessionPayload | null> {
  if (!sessionToken || sessionToken.trim() === "") {
    return null;
  }

  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(sessionToken, secret, {
      algorithms: ["HS256"],
    });

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: {
  id: string;
  schoolId: string;
  role: "ADMIN" | "GURU";
  name: string;
  email: string;
}): Promise<void> {
  const token = await encryptSession({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  const expiresDate = new Date(Date.now() + SESSION_DURATION_MS);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresDate,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decryptSession(sessionCookie);
}
