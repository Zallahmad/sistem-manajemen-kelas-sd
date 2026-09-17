import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getGuruDashboardData } from "@/lib/data/guru";
import { getTeacherAttendanceSchedules, getTodayDateJakarta } from "@/lib/data/attendance";
import { getTeacherGradeStats } from "@/lib/data/grades";
import { StatCard, PageHeader } from "@/components/ui/Cards";
import Link from "next/link";

export default async function GuruDashboardPage() {
  const user = await requireRole("GURU");
  const todayDate = getTodayDateJakarta();

  const [data, todayAttendanceSchedules, gradeStats] = await Promise.all([
    getGuruDashboardData(user.id),
    getTeacherAttendanceSchedules(user.id, todayDate),
    getTeacherGradeStats(user.id),
  ]);

  const completedAttendanceCount = todayAttendanceSchedules.filter((s) => s.isRecorded).length;

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Dashboard Pendidik (Guru)"
        subtitle={`Selamat bertugas, ${user.name}`}
      />

      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Kelas Diampu"
            value={data.assignedClassrooms.length}
            icon="🚪"
            description="Penugasan rombongan belajar"
          />
          <StatCard
            title="Siswa Dibimbing"
            value={data.totalStudentsCount}
            icon="🎒"
            description="Total peserta didik di kelas saya"
          />
          <StatCard
            title="Presensi Hari Ini"
            value={`${completedAttendanceCount}/${todayAttendanceSchedules.length}`}
            icon="📝"
            description="Sesi kelas yang telah diabsen"
          />
          <StatCard
            title="Asesmen Aktif"
            value={gradeStats.activeAssessments}
            icon="📈"
            description={`${gradeStats.totalGradesRecorded} nilai tercatat`}
          />
        </div>

        {/* Today's Attendance & Schedules Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Presensi & Jadwal Hari Ini
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
              </p>
            </div>
            <Link
              href="/guru/absensi"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Semua Jadwal Presensi →
            </Link>
          </div>

          {todayAttendanceSchedules.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              Tidak ada agenda mengajar untuk hari ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAttendanceSchedules.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border space-y-3 ${
                    s.isRecorded
                      ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                      {s.startTime} - {s.endTime}
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
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      Kelas {s.classroomName}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      {s.subjectName} ({s.subjectCode})
                    </p>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/guru/absensi/${s.id}?date=${todayDate}`}
                      className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        s.isRecorded
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {s.isRecorded ? "Edit Presensi →" : "Mulai Absensi →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Classrooms List */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Rombongan Belajar yang Ditugaskan
            </h2>
            <Link
              href="/guru/kelas"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Lihat Semua Kelas →
            </Link>
          </div>

          {data.assignedClassrooms.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              Belum ada kelas yang ditugaskan kepada Anda. Silakan hubungi Administrator sekolah.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.assignedClassrooms.map((c) => (
                <div
                  key={c.assignmentId}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Tingkat {c.gradeLevel} (SD)
                    </span>
                    <span className="text-[10px] text-zinc-400">{c.academicYearName}</span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Kelas {c.classroomName}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Ruang: {c.roomName || "Ruangan Utama"}
                  </p>
                  <div className="pt-2 flex gap-3">
                    <Link
                      href={`/guru/kelas/${c.classroomId}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Buka Ruang Kelas →
                    </Link>
                    <Link
                      href={`/guru/nilai?classroomId=${c.classroomId}`}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Asesmen Kelas →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
