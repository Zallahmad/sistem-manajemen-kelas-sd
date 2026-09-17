import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const DEFAULT_SESSION_SECRET = "default_jwt_secret_change_in_production_min_32_chars";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
  return new TextEncoder().encode(secret);
}

interface MiddlewareSession {
  userId: string;
  schoolId: string;
  role: "ADMIN" | "GURU";
}

async function verifyToken(token?: string): Promise<MiddlewareSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as MiddlewareSession;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie = req.cookies.get("session")?.value;
  const session = await verifyToken(sessionCookie);

  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isGuruRoute = pathname.startsWith("/guru");

  // If user is logged in and visits /login, redirect to their home
  if (isLoginPage && session) {
    const redirectUrl = session.role === "ADMIN" ? "/admin" : "/guru";
    return NextResponse.redirect(new URL(redirectUrl, req.nextUrl));
  }

  // If user is not logged in and tries to access protected areas
  if ((isAdminRoute || isGuruRoute) && !session) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optimistic role checking (actual secure checks still occur server-side in DAL)
  if (isAdminRoute && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/guru", req.nextUrl));
  }

  if (isGuruRoute && session?.role !== "GURU") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/guru/:path*",
  ],
};
