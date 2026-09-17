"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { authenticateUser, destroySession } from "@/lib/auth";

const loginSchema = z.object({
  email: z
    .string({ message: "Email harus berupa teks." })
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
  password: z
    .string({ message: "Kata sandi harus berupa teks." })
    .min(1, "Kata sandi wajib diisi."),
});

export type LoginActionState = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validated = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message || "Input tidak valid.";
    return {
      success: false,
      error: firstError,
    };
  }

  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
    reqHeaders.get("x-real-ip") ||
    "unknown";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  const result = await authenticateUser(
    validated.data.email,
    validated.data.password,
    { ipAddress, userAgent }
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const redirectTo = result.user.role === "ADMIN" ? "/admin" : "/guru";

  return {
    success: true,
    redirectTo,
  };
}

export async function logoutAction(): Promise<void> {
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
    reqHeaders.get("x-real-ip") ||
    "unknown";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  await destroySession({ ipAddress, userAgent });
}
