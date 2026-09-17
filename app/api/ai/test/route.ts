import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGeminiText } from "@/lib/ai/gemini";

const testPromptSchema = z.object({
  prompt: z
    .string({
      message: "Prompt harus berupa teks",
    })
    .trim()
    .min(1, "Prompt tidak boleh kosong")
    .max(2000, "Prompt maksimal 2000 karakter"),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Format request body harus berupa JSON yang valid.",
        },
        { status: 400 }
      );
    }

    const validationResult = testPromptSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message ?? "Input tidak valid.";
      return NextResponse.json(
        {
          success: false,
          error: firstError,
        },
        { status: 400 }
      );
    }

    const result = await generateGeminiText(validationResult.data.prompt);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        text: result.text,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal server.",
      },
      { status: 500 }
    );
  }
}
