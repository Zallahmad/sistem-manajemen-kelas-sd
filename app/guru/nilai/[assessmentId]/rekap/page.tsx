import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAssessmentSummary, ASSESSMENT_TYPE_LABELS, AssessmentType } from "@/lib/data/grades";
import { StatCard, PageHeader } from "@/components/ui/Cards";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GuruRekapAssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const user = await requireRole("GURU");
  const { assessmentId } = await params;

  const data = await getAssessmentSummary(assessmentId, user.schoolId);
  if (!data || data.assessment.teacherId !== user.id && user.role !== "ADMIN") {
    // Verified against school & teacher
    if (!data) notFound();
  }

  const { assessment, stats, students } = data;

  return (
    <AppLayout user={user}>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/guru/nilai"
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 inline-flex items-center gap-1"
        >
          ← Kembali ke Penilaian
        </Link>
        <Link
          href={`/guru/nilai/${assessment.id}`}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
        >
          ✏️ Edit / Input Nilai
        </Link>
      </div>

      <PageHeader
        title={`Rekapitulasi: ${assessment.name}`}
        subtitle={`${ASSESSMENT_TYPE_LABELS[assessment.type as AssessmentType]} • Kelas ${assessment.classroomName} • ${assessment.subjectName} • Tanggal: ${new Date(assessment.assessmentDate).toLocaleDateString("id-ID")}`}
      />

      <div className="space-y-6">
        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total Siswa"
            value={stats.totalStudents}
            icon="🎒"
          />
          <StatCard
            title="Dinilai"
            value={stats.totalGraded}
            icon="✅"
          />
          <StatCard
            title="Belum Dinilai"
            value={stats.totalUngraded}
            icon="⏳"
          />
          <StatCard
            title="Rata-rata"
            value={stats.averageScore}
            icon="📊"
          />
          <StatCard
            title="Tertinggi"
            value={stats.highestScore}
            icon="🏆"
          />
          <StatCard
            title="Terendah"
            value={stats.lowestScore}
            icon="📉"
          />
        </div>

        {/* Student Grade Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Daftar Nilai Hasil Penilaian
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3 w-10">No</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Nilai Siswa</th>
                  <th className="py-2.5 px-3">Persentase</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((st, idx) => (
                  <tr key={st.studentId}>
                    <td className="py-3 px-3 text-zinc-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {st.fullName}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">
                      {st.nis || "-"}
                    </td>
                    <td className="py-3 px-3 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {st.score !== null ? st.score : "-"}
                    </td>
                    <td className="py-3 px-3">
                      {st.percentage !== null ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {st.percentage}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.isGraded
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {st.isGraded ? "Sudah Dinilai" : "Belum Dinilai"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[11px] max-w-xs truncate">
                      {st.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
