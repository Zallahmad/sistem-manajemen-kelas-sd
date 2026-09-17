"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AttendanceStatus } from "@/lib/data/attendance";
import { saveAttendanceAction } from "./actions";

interface StudentAttendanceRow {
  studentId: string;
  fullName: string;
  nis: string | null;
  nisn: string | null;
  gender: string | null;
  status: AttendanceStatus;
  notes: string;
}

interface AttendanceFormProps {
  scheduleId: string;
  dateStr: string;
  initialNotes: string;
  initialStudents: StudentAttendanceRow[];
}

export function AttendanceForm({
  scheduleId,
  dateStr,
  initialNotes,
  initialStudents,
}: AttendanceFormProps) {
  const [students, setStudents] = useState<StudentAttendanceRow[]>(initialStudents);
  const [generalNotes, setGeneralNotes] = useState(initialNotes);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
    );
  };

  const handleSetAllStatus = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const payload = {
      scheduleId,
      attendanceDate: dateStr,
      notes: generalNotes || null,
      records: students.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        notes: s.notes || null,
      })),
    };

    const res = await saveAttendanceAction(payload);
    setIsPending(false);

    if (!res.success) {
      setMessage({ type: "error", text: res.error || "Gagal menyimpan absensi." });
    } else {
      setMessage({ type: "success", text: "Presensi siswa berhasil disimpan ke basis data!" });
      router.refresh();
    }
  };

  // Summary counts
  const countPresent = students.filter((s) => s.status === "PRESENT").length;
  const countSick = students.filter((s) => s.status === "SICK").length;
  const countPerm = students.filter((s) => s.status === "PERMISSION").length;
  const countAbsent = students.filter((s) => s.status === "ABSENT").length;
  const countLate = students.filter((s) => s.status === "LATE").length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Action & Summary Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 mr-2">Tindakan Cepat:</span>
          <button
            type="button"
            onClick={() => handleSetAllStatus("PRESENT")}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer transition"
          >
            ✓ Semua Hadir
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStatus("SICK")}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer transition"
          >
            Semua Sakit
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStatus("PERMISSION")}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer transition"
          >
            Semua Izin
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStatus("ABSENT")}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer transition"
          >
            Semua Alpa
          </button>
        </div>

        {/* Realtime stats badge */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">H: {countPresent}</span>
          <span className="text-amber-600 dark:text-amber-400">S: {countSick}</span>
          <span className="text-blue-600 dark:text-blue-400">I: {countPerm}</span>
          <span className="text-red-600 dark:text-red-400">A: {countAbsent}</span>
          <span className="text-purple-600 dark:text-purple-400">T: {countLate}</span>
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

      {/* Student List Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        {students.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Tidak ada siswa terdaftar pada kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3 w-10">No</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Status Kehadiran</th>
                  <th className="py-2.5 px-3">Catatan Khusus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((st, idx) => (
                  <tr key={st.studentId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                    <td className="py-3 px-3 text-zinc-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{st.fullName}</p>
                      <p className="text-[10px] text-zinc-400">
                        {st.gender === "MALE" ? "Laki-laki" : st.gender === "FEMALE" ? "Perempuan" : "-"}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">{st.nis || "-"}</td>
                    <td className="py-3 px-3">
                      <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-950">
                        {(
                          [
                            { key: "PRESENT", label: "H", full: "Hadir", color: "bg-emerald-600 text-white" },
                            { key: "SICK", label: "S", full: "Sakit", color: "bg-amber-500 text-white" },
                            { key: "PERMISSION", label: "I", full: "Izin", color: "bg-blue-600 text-white" },
                            { key: "ABSENT", label: "A", full: "Alpa", color: "bg-red-600 text-white" },
                            { key: "LATE", label: "T", full: "Terlambat", color: "bg-purple-600 text-white" },
                          ] as const
                        ).map((opt) => {
                          const isSelected = st.status === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleStatusChange(st.studentId, opt.key)}
                              title={opt.full}
                              className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                                isSelected
                                  ? opt.color
                                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={st.notes}
                        onChange={(e) => handleNotesChange(st.studentId, e.target.value)}
                        placeholder="Ket. (misal: demam)..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 placeholder-zinc-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* General Notes and Submit Button */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Catatan Sesi Pelajaran (Opsional):
        </label>
        <textarea
          rows={2}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Tuliskan catatan kejadian pembelajaran hari ini bila ada..."
          className="w-full p-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 placeholder-zinc-400"
        />

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending || students.length === 0}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Menyimpan Presensi..." : "💾 Simpan Presensi Siswa"}
          </button>
        </div>
      </div>
    </form>
  );
}
