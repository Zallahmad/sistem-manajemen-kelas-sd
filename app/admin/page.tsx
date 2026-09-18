import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAdminDashboardStats } from "@/lib/data/schools";
import { getAdminGradeStats } from "@/lib/data/grades";
import { getAdminTeachingModuleStats } from "@/lib/data/teaching-modules";
import { getAdminLessonPlanStats } from "@/lib/data/lesson-plans";
import { getAdminWorksheetStats } from "@/lib/data/worksheets";
import { StatCard, PageHeader } from "@/components/ui/Cards";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const [
    stats,
    gradeStats,
    moduleStats,
    planStats,
    worksheetStats,
  ] = await Promise.all([
    getAdminDashboardStats(user.schoolId),
    getAdminGradeStats(user.schoolId),
    getAdminTeachingModuleStats(user.schoolId),
    getAdminLessonPlanStats(user.schoolId),
    getAdminWorksheetStats(user.schoolId),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Dashboard Administrator"
        subtitle="Ringkasan data operasional dan akademik sekolah dasar"
      />

      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <StatCard
            title="Total Guru"
            value={stats.totalTeachers}
            icon="👨‍🏫"
            description="Tenaga pengajar"
          />
          <StatCard
            title="Total Siswa"
            value={stats.totalStudents}
            icon="🎒"
            description="Siswa aktif"
          />
          <StatCard
            title="Total Kelas"
            value={stats.totalClassrooms}
            icon="🚪"
            description="Rombel"
          />
          <StatCard
            title="Modul Ajar"
            value={moduleStats.totalModules}
            icon="📚"
            description={`${moduleStats.publishedCount} terbit • ${moduleStats.draftCount} draft`}
          />
          <StatCard
            title="RPP"
            value={planStats.totalPlans}
            icon="📑"
            description={`${planStats.publishedCount} terbit • ${planStats.draftCount} draft`}
          />
          <StatCard
            title="LKPD Siswa"
            value={worksheetStats.totalWorksheets}
            icon="📋"
            description={`${worksheetStats.publishedCount} terbit • ${worksheetStats.draftCount} draft`}
          />
          <StatCard
            title="Asesmen"
            value={gradeStats.totalAssessments}
            icon="📈"
            description={`${gradeStats.totalGradesRecorded} nilai`}
          />
        </div>

        {/* Academic Year Info & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Periode Aktif
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  Tahun Ajaran Aktif
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.activeAcademicYear}
                </p>
              </div>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Semester Aktif
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.activeSemester}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Aksi Cepat Menu Utama
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <Link
                href="/admin/guru"
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition text-center space-y-1.5"
              >
                <span className="text-2xl">👨‍🏫</span>
                <p className="text-xs font-semibold">Guru</p>
              </Link>
              <Link
                href="/admin/siswa"
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition text-center space-y-1.5"
              >
                <span className="text-2xl">🎒</span>
                <p className="text-xs font-semibold">Siswa</p>
              </Link>
              <Link
                href="/admin/modul-ajar"
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition text-center space-y-1.5"
              >
                <span className="text-2xl">📚</span>
                <p className="text-xs font-semibold">Modul Ajar</p>
              </Link>
              <Link
                href="/admin/rpp"
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition text-center space-y-1.5"
              >
                <span className="text-2xl">📑</span>
                <p className="text-xs font-semibold">RPP</p>
              </Link>
              <Link
                href="/admin/lkpd"
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition text-center space-y-1.5"
              >
                <span className="text-2xl">📋</span>
                <p className="text-xs font-semibold">LKPD</p>
              </Link>
              <Link
                href="/admin/absensi"
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition text-center space-y-1.5"
              >
                <span className="text-2xl">📝</span>
                <p className="text-xs font-semibold">Presensi</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Audits */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Aktivitas Terkini Sekolah
          </h2>
          {stats.recentAudits.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3">Belum ada aktivitas tercatat.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stats.recentAudits.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-[10px]">
                      {item.action}
                    </span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {item.entityType} ({item.entityId.slice(0, 8)}...)
                    </span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">
                    {new Date(item.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
