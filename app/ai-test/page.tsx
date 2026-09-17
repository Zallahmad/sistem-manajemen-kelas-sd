"use client";

import { useState } from "react";

export default function GeminiTestPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Prompt tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = (await res.json()) as { success: boolean; text?: string; error?: string };

      if (!res.ok || !data.success) {
        setError(data.error || "Gagal menghubungi server.");
      } else {
        setResponse(data.text ?? "");
      }
    } catch {
      setError("Terjadi kesalahan jaringan saat mengirim permintaan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold">Uji Koneksi Google Gemini API</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Halaman uji coba koneksi server-side Gemini API (Google AI Studio Free Tier).
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-1">
              Prompt Uji Coba:
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Berikan 3 tips pembelajaran interaktif untuk siswa kelas 4 SD."
              className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Mengirim ke Gemini..." : "Kirim ke Gemini"}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
            <p className="font-semibold mb-1">Terjadi Kesalahan:</p>
            <p>{error}</p>
          </div>
        )}

        {response !== null && (
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Hasil Respon Gemini:
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800">
              {response || "(Respon kosong)"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
