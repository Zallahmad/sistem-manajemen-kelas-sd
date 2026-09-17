import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getSchedules, DayOfWeek, DAY_NAMES_ID } from "@/lib/data/schedules";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getAllActiveTeachersList } from "@/lib/data/teachers";
import { getClassrooms } from "@/lib/data/classrooms";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { DeactivateScheduleButton } from "./ScheduleClientComponents";
import { ScheduleModalTrigger } from "./ScheduleModalTrigger";

export default async function AdminJadwalPage({
  searchParams,
}: {
  searchParams: Promise<{
    day?: string;
    classroomId?: string;
    teacherId?: string;
    subjectId?: string;
    academicYearId?: string;
    semesterId?: string;
    page?: string;
  }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;

  const dayOfWeek = (params.day as DayOfWeek) || undefined;
  const classroomId = params.classroomId || undefined;
  const teacherId = params.teacherId || undefined;
  const subjectId = params.subjectId || undefined;
  const academicYearId = params.academicYearId || undefined;
  const semesterId = params.semesterId || undefined;
  const page = Number(params.page || 1);

  const [
    schedulesData,
    academicYearsList,
    semestersList,
    teachersList,
    classroomsList,
    subjectsList,
  ] = await Promise.all([
    getSchedules({
      schoolId: user.schoolId,
      dayOfWeek,
      classroomId,
      teacherId,
      subjectId,
      academicYearId,
      semesterId,
      page,
      pageSize: 10,
    }),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
    getAllActiveTeachersList(user.schoolId),
    getClassrooms(user.schoolId),
    getSubjects(user.schoolId),
  ]);

  const { items, total, totalPages } = schedulesData;

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Jadwal Pelajaran Sekolah"
        subtitle={`Manajemen jadwal belajar mengajar terpadu (${total} jadwal aktif)`}
        action={
          <ScheduleModalTrigger
            academicYearsList={academicYearsList}
            semestersList={semestersList}
            teachersList={teachersList}
            classroomsList={classroomsList}
            subjectsList={subjectsList}
          />
        }
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6">
        <form method="GET" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Hari
            </label>
            <select
              name="day"
              defaultValue={dayOfWeek || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Hari</option>
              {Object.entries(DAY_NAMES_ID).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Kelas
            </label>
            <select
              name="classroomId"
              defaultValue={classroomId || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Kelas</option>
              {classroomsList.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Guru
            </label>
            <select
              name="teacherId"
              defaultValue={teacherId || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Guru</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Mata Pelajaran
            </label>
            <select
              name="subjectId"
              defaultValue={subjectId || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Mapel</option>
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Tahun Ajaran
            </label>
            <select
              name="academicYearId"
              defaultValue={academicYearId || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Tahun</option>
              {academicYearsList.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* Schedules Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
              Belum ada jadwal ditemukan.
            </p>
            <p>Silakan sesuaikan filter atau tambahkan jadwal baru menggunakan tombol di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3">Hari & Waktu</th>
                  <th className="py-2.5 px-3">Kelas & Ruang</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Guru Pengampu</th>
                  <th className="py-2.5 px-3">Tahun & Semester</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-3">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {DAY_NAMES_ID[item.dayOfWeek as DayOfWeek] || item.dayOfWeek}
                      </span>
                      <p className="text-[11px] text-zinc-500">
                        {item.startTime} - {item.endTime}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                        Kelas {item.classroomName}
                      </span>
                      {item.room && <p className="text-[10px] text-zinc-500 mt-0.5">{item.room}</p>}
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.subjectName}
                      <p className="text-[10px] text-zinc-400 font-normal">[{item.subjectCode}]</p>
                    </td>
                    <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300">
                      {item.teacherName}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[11px]">
                      {item.academicYearName}
                      <p>Semester {item.semesterName}</p>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <DeactivateScheduleButton scheduleId={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-between text-xs text-zinc-500">
                <span>Halaman {page} dari {totalPages}</span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={`/admin/jadwal?page=${page - 1}`}
                      className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
                    >
                      Sebelumnya
                    </a>
                  )}
                  {page < totalPages && (
                    <a
                      href={`/admin/jadwal?page=${page + 1}`}
                      className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
                    >
                      Berikutnya
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
