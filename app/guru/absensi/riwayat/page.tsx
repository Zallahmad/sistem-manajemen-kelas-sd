import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTeacherAttendanceHistory } from "@/lib/data/attendance";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";

export default async function GuruRiwayatAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string }>;
}) {
  const user = await requireRole("GURU");
  const params = await searchParams;
  const classroomId = params.classroomId || undefined;

  const [history, assignedClassrooms] = await Promise.all([
    getTeacherAttendanceHistory(user.id, classroomId),
    getGuruAssignedClassrooms(user.id),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Riwayat Presensi Kelas"
        subtitle="Daftar rekap sesi presensi yang telah Anda simpan"
        action={
          <Link
            href="/guru/absensi"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            ➕ Input Presensi Baru
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6">
        <form method="GET" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Filter Rombongan Belajar:
          </label>
          <select
            name="classroomId"
            defaultValue={classroomId || ""}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">Semua Kelas</option>
            {assignedClassrooms.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name} ({c.academicYearName})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold"
          >
            Terapkan
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Belum ada riwayat absensi yang tersimpan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Total Siswa</th>
                  <th className="py-2.5 px-3">Hadir</th>
                  <th className="py-2.5 px-3">Sakit</th>
                  <th className="py-2.5 px-3">Izin</th>
                  <th className="py-2.5 px-3">Alpa</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {new Date(h.attendanceDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                        Kelas {h.classroomName}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold">{h.stats.total}</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">{h.stats.present}</td>
                    <td className="py-3 px-3 text-amber-600 font-bold">{h.stats.sick}</td>
                    <td className="py-3 px-3 text-blue-600 font-bold">{h.stats.permission}</td>
                    <td className="py-3 px-3 text-red-600 font-bold">{h.stats.absent}</td>
                    <td className="py-3 px-3 text-zinc-400 text-[11px] max-w-xs truncate">
                      {h.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
