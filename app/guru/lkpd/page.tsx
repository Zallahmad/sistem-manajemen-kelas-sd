import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getTeacherWorksheets,
  DocumentStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
} from "@/lib/data/worksheets";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader, StatCard } from "@/components/ui/Cards";
import Link from "next/link";

export default async function GuruWorksheetPage({
  searchParams,
}: {
  searchParams: Promise<{
    academicYearId?: string;
    semesterId?: string;
    classroomId?: string;
    subjectId?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const user = await requireRole("GURU");
  const params = await searchParams;

  const academicYearId = params.academicYearId || undefined;
  const semesterId = params.semesterId || undefined;
  const classroomId = params.classroomId || undefined;
  const subjectId = params.subjectId || undefined;
  const status = (params.status as DocumentStatus) || undefined;
  const search = params.search || undefined;

  const [
    worksheetsList,
    academicYearsList,
    semestersList,
    classroomsList,
    subjectsList,
  ] = await Promise.all([
    getTeacherWorksheets({
      teacherUserId: user.id,
      academicYearId,
      semesterId,
      classroomId,
      subjectId,
      status,
      search,
    }),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
  ]);

  const totalPublished = worksheetsList.filter((m) => m.status === "PUBLISHED").length;
  const totalDraft = worksheetsList.filter((m) => m.status === "DRAFT").length;
  const totalReview = worksheetsList.filter((m) => m.status === "REVIEW").length;

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Lembar Kerja Peserta Didik (LKPD)"
        subtitle="Kelola materi tugas, aktivitas belajar, dan lembar kerja interaktif siswa SD"
        action={
          <Link
            href="/guru/lkpd/new"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Buat LKPD Baru</span>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total LKPD"
            value={worksheetsList.length}
            icon="📋"
            description="Dokumen aktif tersimpan"
          />
          <StatCard
            title="Diterbitkan (Published)"
            value={totalPublished}
            icon="🚀"
            description="Siap dicetak / digunakan"
          />
          <StatCard
            title="Draft Belum Selesai"
            value={totalDraft}
            icon="📝"
            description="Perlu dilengkapi guru"
          />
          <StatCard
            title="Dalam Telaah (Review)"
            value={totalReview}
            icon="🔍"
            description="Menunggu supervisi"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                Pencarian Judul / Topik
              </label>
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Cari kata kunci LKPD..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
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
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Worksheets Table List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          {worksheetsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                Belum ada Lembar Kerja Peserta Didik (LKPD) ditemukan.
              </p>
              <p>Mulai susun LKPD baru yang interaktif untuk kelas binaan Anda.</p>
              <div className="pt-2">
                <Link
                  href="/guru/lkpd/new"
                  className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                >
                  + Buat LKPD Baru
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Judul LKPD & Topik</th>
                    <th className="py-2.5 px-3">Kelas & Mapel</th>
                    <th className="py-2.5 px-3">Aktivitas / Soal</th>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Versi</th>
                    <th className="py-2.5 px-3">Terakhir Diperbarui</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {worksheetsList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                      <td className="py-3 px-3 max-w-xs">
                        <Link
                          href={`/guru/lkpd/${item.id}`}
                          className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          Topik: {item.topic}
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
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {item.activityCount} Aktivitas
                        </span>
                        <p className="text-[11px] text-zinc-400">{item.questionCount} Butir Soal</p>
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
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-bold text-[10px]">
                          v{item.versionCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-[11px]">
                        {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/guru/lkpd/${item.id}/preview`}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition"
                            title="Preview Dokumen"
                          >
                            📄 Preview
                          </Link>
                          <Link
                            href={`/guru/lkpd/${item.id}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition"
                          >
                            Edit →
                          </Link>
                        </div>
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
