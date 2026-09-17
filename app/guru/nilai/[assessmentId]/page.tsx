import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAssessmentInputData, ASSESSMENT_TYPE_LABELS, AssessmentType } from "@/lib/data/grades";
import { PageHeader } from "@/components/ui/Cards";
import { GradeInputForm } from "../GradeInputForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GuruInputNilaiPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const user = await requireRole("GURU");
  const { assessmentId } = await params;

  const data = await getAssessmentInputData(assessmentId, user.id);
  if (!data) {
    notFound();
  }

  const { assessment, students } = data;

  return (
    <AppLayout user={user}>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/guru/nilai"
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 inline-flex items-center gap-1"
        >
          ← Kembali ke Daftar Penilaian
        </Link>
        <Link
          href={`/guru/nilai/${assessment.id}/rekap`}
          className="text-xs text-blue-600 hover:underline font-semibold"
        >
          Lihat Rekap Nilai →
        </Link>
      </div>

      <PageHeader
        title={assessment.name}
        subtitle={`${ASSESSMENT_TYPE_LABELS[assessment.type as AssessmentType]} • Kelas ${assessment.classroomName} • ${assessment.subjectName} • ${assessment.academicYearName} • Skor Maksimal: ${assessment.maxScore}`}
      />

      <GradeInputForm
        assessmentId={assessment.id}
        maxScore={Number(assessment.maxScore)}
        initialStudents={students}
      />
    </AppLayout>
  );
}
