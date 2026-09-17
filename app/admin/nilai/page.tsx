import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getAdminAssessments,
  getAdminClassroomGradeRecap,
  getAdminStudentGradeRecap,
  ASSESSMENT_TYPE_LABELS,
  AssessmentType,
} from "@/lib/data/grades";
import { getClassrooms } from "@/lib/data/classrooms";
import { getAllActiveTeachersList } from "@/lib/data/teachers";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";

export default async function AdminNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    academicYearId?: string;
    semesterId?: string;
    classroomId?: string;
    teacherId?: string;
    subjectId?: string;
    type?: string;
  }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const tab = params.tab || "rekap-kelas";

  const academicYearId = params.academicYearId || undefined;
  const semesterId = params.semesterId || undefined;
  const classroomId = params.classroomId || undefined;
  const teacherId = params.teacherId || undefined;
  const subjectId = params.subjectId || undefined;
  const type = (params.type as AssessmentType) || undefined;

  const [
    classroomsList,
    teachersList,
    subjectsList,
    assessmentsList,
    classroomRecap,
    studentRecap,
  ] = await Promise.all([
    getClassrooms(user.schoolId),
    getAllActiveTeachersList(user.schoolId),
    getSubjects(user.schoolId),
    tab === "komponen"
      ? getAdminAssessments({
          schoolId: user.schoolId,
          academicYearId,
          semesterId,
          classroomId,
          teacherId,
          subjectId,
          type,
        })
      : Promise.resolve([]),
    tab === "rekap-kelas" ? getAdminClassroomGradeRecap(user.schoolId) : Promise.resolve([]),
    tab === "rekap-siswa"
      ? getAdminStudentGradeRecap(user.schoolId, classroomId)
      : Promise.resolve([]),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Rekapitulasi Nilai & Asesmen Sekolah"
        subtitle="Monitoring capaian akademik seluruh kelas dan siswa sekolah dasar"
      />

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-4 text-xs font-bold">
        <a
          href="/admin/nilai?tab=rekap-kelas"
          className={`pb-2.5 transition border-b-2 ${
            tab === "rekap-kelas"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          📊 Rekap Nilai Per Kelas
        </a>
        <a
          href="/admin/nilai?tab=rekap-siswa"
          className={`pb-2.5 transition border-b-2 ${
            tab === "rekap-siswa"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          🎒 Rekap Nilai Per Siswa
        </a>
        <a
          href="/admin/nilai?tab=komponen"
          className={`pb-2.5 transition border-b-2 ${
            tab === "komponen"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          📑 Daftar Komponen Penilaian Guru
        </a>
      </div>

      {/* TAB 1: REKAP KELAS */}
      {tab === "rekap-kelas" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Rata-rata Capaian Akademik Per Rombongan Belajar
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
                    <th className="py-2.5 px-3">Total Asesmen</th>
                    <th className="py-2.5 px-3">Nilai Tercatat</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata Nilai</th>
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
                      <td className="py-3 px-3 font-bold">{c.totalAssessments}</td>
                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 font-bold">
                        {c.totalGrades}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {c.avgScore}
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
              Rata-rata Capaian Siswa
            </h2>
            <form method="GET" className="flex items-center gap-2">
              <input type="hidden" name="tab" value="rekap-siswa" />
              <select
                name="classroomId"
                defaultValue={classroomId || ""}
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
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Filter
              </button>
            </form>
          </div>

          {studentRecap.length === 0 ? (
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
                    <th className="py-2.5 px-3">Total Nilai</th>
                    <th className="py-2.5 px-3">Tertinggi</th>
                    <th className="py-2.5 px-3">Terendah</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata</th>
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
                      <td className="py-3 px-3 font-bold">{st.totalGrades}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">{st.maxScore}</td>
                      <td className="py-3 px-3 text-amber-600 font-bold">{st.minScore}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {st.avgScore}
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

      {/* TAB 3: DAFTAR KOMPONEN */}
      {tab === "komponen" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Asesmen Guru Terdaftar
            </h2>
            <form method="GET" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="hidden" name="tab" value="komponen" />
              <select
                name="classroomId"
                defaultValue={classroomId || ""}
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
                defaultValue={teacherId || ""}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Semua Guru</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
              <select
                name="subjectId"
                defaultValue={subjectId || ""}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Semua Mapel</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Filter
              </button>
            </form>
          </div>

          {assessmentsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada komponen penilaian tersimpan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Judul Penilaian</th>
                    <th className="py-2.5 px-3">Kelas & Mapel</th>
                    <th className="py-2.5 px-3">Guru Perekam</th>
                    <th className="py-2.5 px-3">Jenis & Tgl</th>
                    <th className="py-2.5 px-3">Siswa Dinilai</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {assessmentsList.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                        <p className="text-[10px] text-zinc-500">Maks: {item.maxScore}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                          Kelas {item.classroomName}
                        </span>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{item.subjectName}</p>
                      </td>
                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                        {item.teacherName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {ASSESSMENT_TYPE_LABELS[item.type as AssessmentType] || item.type}
                        </span>
                        <p className="text-[10px] text-zinc-400">
                          {new Date(item.assessmentDate).toLocaleDateString("id-ID")}
                        </p>
                      </td>
                      <td className="py-3 px-3 font-bold">{item.totalGraded} Siswa</td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {item.avgScore}
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
