import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getAdminTeachingModules,
  DocumentStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
} from "@/lib/data/teaching-modules";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getClassrooms } from "@/lib/data/classrooms";
import { getSubjects } from "@/lib/data/subjects";
import { getAllActiveTeachersList } from "@/lib/data/teachers";
import { PageHeader, StatCard } from "@/components/ui/Cards";
import Link from "next/link";

export default async function AdminModulAjarPage({
  searchParams,
}: {
  searchParams: Promise<{
    teacherId?: string;
    classroomId?: string;
    subjectId?: string;
    academicYearId?: string;
    semesterId?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;

  const teacherId = params.teacherId || undefined;
  const classroomId = params.classroomId || undefined;
  const subjectId = params.subjectId || undefined;
  const academicYearId = params.academicYearId || undefined;
  const semesterId = params.semesterId || undefined;
  const status = (params.status as DocumentStatus) || undefined;
  const search = params.search || undefined;

  const [
    modulesList,
    teachersList,
    classroomsList,
    subjectsList,
    academicYearsList,
    semestersList,
  ] = await Promise.all([
    getAdminTeachingModules({
      schoolId: user.schoolId,
      teacherId,
      classroomId,
      subjectId,
      academicYearId,
      semesterId,
      status,
      search,
    }),
    getAllActiveTeachersList(user.schoolId),
    getClassrooms(user.schoolId),
    getSubjects(user.schoolId),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
  ]);

  const totalPublished = modulesList.filter((m) => m.status === "PUBLISHED").length;
  const totalDraft = modulesList.filter((m) => m.status === "DRAFT").length;
  const totalReview = modulesList.filter((m) => m.status === "REVIEW").length;

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Monitoring Modul Ajar Sekolah"
        subtitle="Supervisi dan pemantauan dokumen Modul Ajar Kurikulum Merdeka seluruh guru"
      />

      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Modul Ajar"
            value={modulesList.length}
            icon="📚"
            description="Dokumen aktif di sekolah"
          />
          <StatCard
            title="Diterbitkan (Published)"
            value={totalPublished}
            icon="🚀"
            description="Dokumen selesai disusun"
          />
          <StatCard
            title="Draft Guru"
            value={totalDraft}
            icon="📝"
            description="Sedang dalam penyusunan"
          />
          <StatCard
            title="Menunggu Review"
            value={totalReview}
            icon="🔍"
            description="Perlu supervisi"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Pencarian Judul / Topik / Guru
              </label>
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Cari topik atau nama guru..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Guru Pengampu
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
                {academicYearsList.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Semester
              </label>
              <select
                name="semesterId"
                defaultValue={semesterId || ""}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Semua Semester</option>
                {semestersList.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition"
              >
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>

        {/* Modules Table List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          {modulesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                Tidak ada dokumen Modul Ajar ditemukan.
              </p>
              <p>Belum ada modul ajar yang sesuai dengan filter pencarian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Judul & Topik</th>
                    <th className="py-2.5 px-3">Guru Penyusun</th>
                    <th className="py-2.5 px-3">Kelas & Mapel</th>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Terakhir Update</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {modulesList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                      <td className="py-3 px-3 max-w-xs">
                        <Link
                          href={`/admin/modul-ajar/${item.id}`}
                          className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          Topik: {item.topic}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.teacherName}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                          Kelas {item.classroomName}
                        </span>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
                          {item.subjectName} ({item.subjectCode})
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {item.semesterName}
                        </p>
                        <p className="text-[11px] text-zinc-400">{item.academicYearName}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            DOCUMENT_STATUS_BADGE_CLASSES[item.status as DocumentStatus]
                          }`}
                        >
                          {DOCUMENT_STATUS_LABELS[item.status as DocumentStatus]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-[11px]">
                        {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/modul-ajar/${item.id}`}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition"
                        >
                          Detail & Versi →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
