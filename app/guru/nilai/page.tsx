import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getTeacherAssessments,
  AssessmentType,
  ASSESSMENT_TYPE_LABELS,
} from "@/lib/data/grades";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import {
  AssessmentModalTrigger,
  DeactivateAssessmentButton,
} from "./NilaiClientComponents";
import Link from "next/link";

export default async function GuruNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{
    academicYearId?: string;
    semesterId?: string;
    classroomId?: string;
    subjectId?: string;
    type?: string;
  }>;
}) {
  const user = await requireRole("GURU");
  const params = await searchParams;

  const academicYearId = params.academicYearId || undefined;
  const semesterId = params.semesterId || undefined;
  const classroomId = params.classroomId || undefined;
  const subjectId = params.subjectId || undefined;
  const type = (params.type as AssessmentType) || undefined;

  const [
    assessmentsList,
    academicYearsList,
    semestersList,
    classroomsList,
    subjectsList,
  ] = await Promise.all([
    getTeacherAssessments({
      teacherUserId: user.id,
      academicYearId,
      semesterId,
      classroomId,
      subjectId,
      type,
    }),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Penilaian & Asesmen Siswa"
        subtitle="Kelola penilaian ulangan harian, kuis, PTS, PAS, proyek, dan tugas kelas"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/guru/nilai/siswa"
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold transition"
            >
              🎒 Rekap Nilai Siswa
            </Link>
            <AssessmentModalTrigger
              academicYearsList={academicYearsList}
              semestersList={semestersList}
              classroomsList={classroomsList}
              subjectsList={subjectsList}
            />
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6">
        <form method="GET" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
              Jenis Penilaian
            </label>
            <select
              name="type"
              defaultValue={type || ""}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">Semua Jenis</option>
              {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
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
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* Assessments List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        {assessmentsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
              Belum ada komponen penilaian ditemukan.
            </p>
            <p>Klik tombol di atas untuk membuat komponen penilaian baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3">Judul Penilaian</th>
                  <th className="py-2.5 px-3">Kelas & Mapel</th>
                  <th className="py-2.5 px-3">Tanggal & Jenis</th>
                  <th className="py-2.5 px-3">Status Input Nilai</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {assessmentsList.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                    <td className="py-3 px-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">Skor Maksimal: {item.maxScore}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                        Kelas {item.classroomName}
                      </span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
                        {item.subjectName}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {ASSESSMENT_TYPE_LABELS[item.type as AssessmentType] || item.type}
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        {new Date(item.assessmentDate).toLocaleDateString("id-ID")}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isCompleted
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {item.gradedCount} / {item.totalStudents} Siswa Dinilai
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/guru/nilai/${item.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition"
                        >
                          Input Nilai →
                        </Link>
                        <Link
                          href={`/guru/nilai/${item.id}/rekap`}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition"
                        >
                          Rekap
                        </Link>
                        <DeactivateAssessmentButton assessmentId={item.id} />
                      </div>
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
