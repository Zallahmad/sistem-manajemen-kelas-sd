import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
}

export interface GeminiSuccessResult {
  success: true;
  text: string;
}

export interface GeminiErrorResult {
  success: false;
  error: string;
}

export type GeminiResult = GeminiSuccessResult | GeminiErrorResult;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  return new GoogleGenAI({ apiKey });
}

export function getGeminiModelName(overrideModel?: string): string {
  if (overrideModel && overrideModel.trim() !== "") {
    return overrideModel.trim();
  }

  const envModel = process.env.GEMINI_MODEL;
  if (envModel && envModel.trim() !== "") {
    return envModel.trim();
  }

  return DEFAULT_GEMINI_MODEL;
}

export async function generateGeminiText(
  prompt: string,
  options?: GeminiGenerateOptions
): Promise<GeminiResult> {
  try {
    const ai = getGeminiClient();
    const model = getGeminiModelName(options?.model);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: options?.temperature !== undefined ? { temperature: options.temperature } : undefined,
    });

    const outputText = response.text ?? "";

    return {
      success: true,
      text: outputText,
    };
  } catch (error: unknown) {
    const safeErrorMessage = mapGeminiErrorToUserMessage(error);
    return {
      success: false,
      error: safeErrorMessage,
    };
  }
}

function mapGeminiErrorToUserMessage(error: unknown): string {
  if (error instanceof Error && error.message === "GEMINI_API_KEY_MISSING") {
    return "API Key Gemini belum dikonfigurasi di server (GEMINI_API_KEY).";
  }

  const errString = error instanceof Error ? error.message : String(error);
  const statusMatch = /status\s*[:=]?\s*(\d{3})/i.exec(errString) || /(\d{3})/.exec(errString);
  const statusCode = statusMatch ? statusMatch[1] : null;

  if (statusCode === "429" || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(errString)) {
    return "Batas kuota / rate limit Gemini Free Tier telah tercapai. Silakan coba beberapa saat lagi.";
  }

  if (
    statusCode === "401" ||
    statusCode === "403" ||
    /API_KEY_INVALID|PERMISSION_DENIED|invalid api key/i.test(errString)
  ) {
    return "API Key Gemini tidak valid atau tidak memiliki izin akses.";
  }

  if (statusCode === "404" || /NOT_FOUND|model not found/i.test(errString)) {
    return "Model Gemini yang diminta tidak ditemukan atau tidak tersedia pada Free Tier.";
  }

  if (statusCode === "503" || statusCode === "504" || /DEADLINE_EXCEEDED|timeout|timed out/i.test(errString)) {
    return "Koneksi ke server Gemini mengalami batas waktu (timeout) atau layanan sedang sibuk.";
  }

  return "Terjadi kesalahan saat berkomunikasi dengan layanan Google Gemini.";
}
