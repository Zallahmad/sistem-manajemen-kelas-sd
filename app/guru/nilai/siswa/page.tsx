import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTeacherStudentGradeSummary } from "@/lib/data/grades";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";

export default async function GuruNilaiSiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; subjectId?: string }>;
}) {
  const user = await requireRole("GURU");
  const params = await searchParams;
  const classroomId = params.classroomId || undefined;
  const subjectId = params.subjectId || undefined;

  const [studentSummary, assignedClassrooms, subjectsList] = await Promise.all([
    getTeacherStudentGradeSummary({
      teacherUserId: user.id,
      classroomId,
      subjectId,
    }),
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
  ]);

  return (
    <AppLayout user={user}>
      <div className="mb-3">
        <Link
          href="/guru/nilai"
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 inline-flex items-center gap-1"
        >
          ← Kembali ke Penilaian
        </Link>
      </div>

      <PageHeader
        title="Rekapitulasi Nilai Per Siswa"
        subtitle="Lihat capaian akumulasi nilai, rata-rata, dan histori asesmen peserta didik"
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Kelas
            </label>
            <select
              name="classroomId"
              defaultValue={classroomId || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Kelas Binaan</option>
              {assignedClassrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name} ({c.academicYearName})
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
              <option value="">Semua Mata Pelajaran</option>
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold cursor-pointer"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        {studentSummary.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Belum ada data nilai siswa ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Total Asesmen</th>
                  <th className="py-2.5 px-3">Rata-rata</th>
                  <th className="py-2.5 px-3">Tertinggi</th>
                  <th className="py-2.5 px-3">Terendah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {studentSummary.map((st) => (
                  <tr key={`${st.studentId}-${st.className}`}>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {st.fullName}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">
                      {st.nis || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                        Kelas {st.className}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold">{st.totalAssessments}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {st.averageScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">{st.highestScore}</td>
                    <td className="py-3 px-3 text-amber-600 font-bold">{st.lowestScore}</td>
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
