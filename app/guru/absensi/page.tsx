import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getTeacherAttendanceSchedules,
  getTodayDateJakarta,
} from "@/lib/data/attendance";
import { DAY_NAMES_ID, DayOfWeek } from "@/lib/data/schedules";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";

export default async function GuruAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireRole("GURU");
  const params = await searchParams;
  const dateStr = params.date || getTodayDateJakarta();

  const schedulesList = await getTeacherAttendanceSchedules(user.id, dateStr);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Presensi / Absensi Siswa"
        subtitle="Pilih rombongan belajar dan jadwal mengajar untuk melakukan absensi"
        action={
          <Link
            href="/guru/absensi/riwayat"
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold transition"
          >
            📋 Riwayat Absensi
          </Link>
        }
      />

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6">
        <form method="GET" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Pilih Tanggal Presensi:
          </label>
          <input
            name="date"
            type="date"
            defaultValue={dateStr}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Tampilkan Jadwal
          </button>
        </form>
      </div>

      {/* Schedules Grid for Attendance */}
      {schedulesList.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Belum ada jadwal mengajar.
          </p>
          <p className="text-xs text-zinc-500">
            Tidak ditemukan jadwal mengajar aktif yang ditugaskan kepada Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedulesList.map((s) => (
            <div
              key={s.id}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 space-y-4 transition ${
                s.isRecorded
                  ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {DAY_NAMES_ID[s.dayOfWeek as DayOfWeek] || s.dayOfWeek} • {s.startTime} - {s.endTime}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.isRecorded
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {s.isRecorded ? "Sudah Diabsen" : "Belum Diabsen"}
                </span>
              </div>

              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Kelas {s.classroomName}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
                  {s.subjectName} ({s.subjectCode})
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Ruang: {s.room || "Kelas Reguler"} • {s.academicYearName}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <Link
                  href={`/guru/absensi/${s.id}?date=${dateStr}`}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    s.isRecorded
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {s.isRecorded ? "Perbarui / Edit Presensi →" : "Isi Presensi Sekarang →"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
