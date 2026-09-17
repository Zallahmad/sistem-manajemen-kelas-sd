"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveGradesAction } from "./actions";

interface StudentGradeRow {
  studentId: string;
  fullName: string;
  nis: string | null;
  nisn: string | null;
  gender: string | null;
  score: string;
  notes: string;
}

interface GradeInputFormProps {
  assessmentId: string;
  maxScore: number;
  initialStudents: StudentGradeRow[];
}

export function GradeInputForm({
  assessmentId,
  maxScore,
  initialStudents,
}: GradeInputFormProps) {
  const [students, setStudents] = useState<StudentGradeRow[]>(initialStudents);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleScoreChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, score: value } : s))
    );
  };

  const handleNotesChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes: value } : s))
    );
  };

  const handleReset = () => {
    if (confirm("Apakah Anda ingin mereset seluruh input nilai pada halaman ini?")) {
      setStudents(initialStudents);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    // Filter students with filled scores
    const filledGrades: Array<{ studentId: string; score: number; notes: string | null }> = [];

    for (const s of students) {
      if (s.score.trim() !== "") {
        const num = Number(s.score);
        if (isNaN(num)) {
          setMessage({
            type: "error",
            text: `Nilai untuk ${s.fullName} harus berupa angka valid.`,
          });
          setIsPending(false);
          return;
        }
        if (num < 0 || num > maxScore) {
          setMessage({
            type: "error",
            text: `Nilai untuk ${s.fullName} (${num}) harus antara 0 dan ${maxScore}.`,
          });
          setIsPending(false);
          return;
        }
        filledGrades.push({
          studentId: s.studentId,
          score: num,
          notes: s.notes.trim() || null,
        });
      }
    }

    const res = await saveGradesAction({
      assessmentId,
      grades: filledGrades,
    });

    setIsPending(false);

    if (!res.success) {
      setMessage({ type: "error", text: res.error || "Gagal menyimpan nilai." });
    } else {
      setMessage({
        type: "success",
        text: `Berhasil menyimpan ${filledGrades.length} nilai siswa!`,
      });
      router.refresh();
    }
  };

  const totalFilled = students.filter((s) => s.score.trim() !== "").length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-xs space-y-1">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            Progress Input Nilai:{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {totalFilled} dari {students.length} Siswa
            </span>
          </p>
          <p className="text-zinc-400 text-[11px]">
            Batas nilai: 0 sampai dengan {maxScore} (Kosongkan jika siswa belum mengikuti penilaian)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isPending || students.length === 0}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Menyimpan..." : "💾 Simpan Semua Nilai"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Grade Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        {students.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Tidak ada siswa aktif terdaftar di kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3 w-10">No</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3 w-36">Nilai (Maks: {maxScore})</th>
                  <th className="py-2.5 px-3">Catatan / Umpan Balik Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((st, idx) => (
                  <tr key={st.studentId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                    <td className="py-3 px-3 text-zinc-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {st.fullName}
                      <p className="text-[10px] text-zinc-400 font-normal">
                        {st.gender === "MALE" ? "Laki-laki" : st.gender === "FEMALE" ? "Perempuan" : "-"}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">
                      {st.nis || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={maxScore}
                        value={st.score}
                        onChange={(e) => handleScoreChange(st.studentId, e.target.value)}
                        placeholder={`0 - ${maxScore}`}
                        className="w-28 px-3 py-1.5 text-xs font-bold text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={st.notes}
                        onChange={(e) => handleNotesChange(st.studentId, e.target.value)}
                        placeholder="Catatan kompetensi (opsional)..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 placeholder-zinc-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </form>
  );
}
