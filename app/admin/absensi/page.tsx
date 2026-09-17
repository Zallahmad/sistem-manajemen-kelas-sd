import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getAdminAttendanceSummary,
  getAdminClassroomRecap,
  getAdminStudentRecap,
} from "@/lib/data/attendance";
import { getClassrooms } from "@/lib/data/classrooms";
import { getAllActiveTeachersList } from "@/lib/data/teachers";
import { PageHeader } from "@/components/ui/Cards";

export default async function AdminAbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    date?: string;
    classroomId?: string;
    teacherId?: string;
  }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const tab = params.tab || "rekap-kelas";
  const dateFilter = params.date || undefined;
  const classroomIdFilter = params.classroomId || undefined;
  const teacherIdFilter = params.teacherId || undefined;

  const [classroomsList, teachersList, summaryList, classroomRecap, studentRecap] =
    await Promise.all([
      getClassrooms(user.schoolId),
      getAllActiveTeachersList(user.schoolId),
      tab === "sesi"
        ? getAdminAttendanceSummary(user.schoolId, {
            date: dateFilter,
            classroomId: classroomIdFilter,
            teacherId: teacherIdFilter,
          })
        : Promise.resolve([]),
      tab === "rekap-kelas" ? getAdminClassroomRecap(user.schoolId) : Promise.resolve([]),
      tab === "rekap-siswa"
        ? getAdminStudentRecap(user.schoolId, classroomIdFilter)
        : Promise.resolve([]),
    ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Rekapitulasi Presensi Siswa"
        subtitle="Monitoring kehadiran seluruh peserta didik dan kelas di sekolah"
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-4 text-xs font-bold">
        <a
          href="/admin/absensi?tab=rekap-kelas"
          className={`pb-2.5 transition border-b-2 ${
            tab === "rekap-kelas"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          📊 Rekap Per Kelas
        </a>
        <a
          href="/admin/absensi?tab=rekap-siswa"
          className={`pb-2.5 transition border-b-2 ${
            tab === "rekap-siswa"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          🎒 Rekap Per Siswa
        </a>
        <a
          href="/admin/absensi?tab=sesi"
          className={`pb-2.5 transition border-b-2 ${
            tab === "sesi"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          📑 Daftar Sesi Presensi
        </a>
      </div>

      {/* TAB 1: REKAP KELAS */}
      {tab === "rekap-kelas" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tingkat Kehadiran Per Rombongan Belajar
          </h2>

          {classroomRecap.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada data kelas yang terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Kelas / Tingkat</th>
                    <th className="py-2.5 px-3">Tahun Ajaran</th>
                    <th className="py-2.5 px-3">Total Record</th>
                    <th className="py-2.5 px-3">Hadir</th>
                    <th className="py-2.5 px-3">Sakit</th>
                    <th className="py-2.5 px-3">Izin</th>
                    <th className="py-2.5 px-3">Alpa</th>
                    <th className="py-2.5 px-3 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {classroomRecap.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        Kelas {c.name}
                        <p className="text-[10px] text-zinc-500">Tingkat {c.gradeLevel} SD</p>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">{c.academicYearName}</td>
                      <td className="py-3 px-3 font-bold">{c.totalRecords}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">{c.present}</td>
                      <td className="py-3 px-3 text-amber-600 font-bold">{c.sick}</td>
                      <td className="py-3 px-3 text-blue-600 font-bold">{c.permission}</td>
                      <td className="py-3 px-3 text-red-600 font-bold">{c.absent}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            c.percentage >= 85
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : c.percentage >= 70
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {c.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REKAP SISWA */}
      {tab === "rekap-siswa" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Akumulasi Kehadiran Siswa
            </h2>
            <form method="GET" className="flex items-center gap-2">
              <input type="hidden" name="tab" value="rekap-siswa" />
              <select
                name="classroomId"
                defaultValue={classroomIdFilter || ""}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Semua Rombongan Belajar</option>
                {classroomsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold"
              >
                Filter
              </button>
            </form>
          </div>

          {studentRecap.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada data siswa ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Hadir</th>
                    <th className="py-2.5 px-3">Sakit</th>
                    <th className="py-2.5 px-3">Izin</th>
                    <th className="py-2.5 px-3">Alpa</th>
                    <th className="py-2.5 px-3 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {studentRecap.map((st) => (
                    <tr key={st.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {st.fullName}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-500">{st.nis || "-"}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                          Kelas {st.className || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">{st.present}</td>
                      <td className="py-3 px-3 text-amber-600 font-bold">{st.sick}</td>
                      <td className="py-3 px-3 text-blue-600 font-bold">{st.permission}</td>
                      <td className="py-3 px-3 text-red-600 font-bold">{st.absent}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            st.percentage >= 85
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : st.percentage >= 70
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {st.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAFTAR SESI */}
      {tab === "sesi" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Log Sesi Presensi Guru
            </h2>
            <form method="GET" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="hidden" name="tab" value="sesi" />
              <input
                name="date"
                type="date"
                defaultValue={dateFilter || ""}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
              <select
                name="classroomId"
                defaultValue={classroomIdFilter || ""}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Semua Kelas</option>
                {classroomsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
              <select
                name="teacherId"
                defaultValue={teacherIdFilter || ""}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Semua Guru</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold"
              >
                Filter
              </button>
            </form>
          </div>

          {summaryList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada sesi presensi tersimpan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Guru Perekam</th>
                    <th className="py-2.5 px-3">Total Siswa</th>
                    <th className="py-2.5 px-3">Hadir</th>
                    <th className="py-2.5 px-3">Sakit</th>
                    <th className="py-2.5 px-3">Izin</th>
                    <th className="py-2.5 px-3">Alpa</th>
                    <th className="py-2.5 px-3 text-right">Tingkat Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {summaryList.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {new Date(item.attendanceDate).toLocaleDateString("id-ID", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                          Kelas {item.classroomName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                        {item.teacherName}
                      </td>
                      <td className="py-3 px-3 font-bold">{item.stats.total}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">{item.stats.present}</td>
                      <td className="py-3 px-3 text-amber-600 font-bold">{item.stats.sick}</td>
                      <td className="py-3 px-3 text-blue-600 font-bold">{item.stats.permission}</td>
                      <td className="py-3 px-3 text-red-600 font-bold">{item.stats.absent}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
