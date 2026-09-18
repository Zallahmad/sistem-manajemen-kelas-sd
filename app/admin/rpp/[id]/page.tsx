import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getLessonPlanById,
  getLessonPlanVersions,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DocumentStatus,
  LessonPlanContent,
} from "@/lib/data/lesson-plans";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";
import { PrintButton } from "@/app/guru/modul-ajar/[id]/preview/PrintButton";

export default async function AdminLessonPlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const { id } = await params;
  const { v } = await searchParams;

  const [planData, versions] = await Promise.all([
    getLessonPlanById(id, user.schoolId),
    getLessonPlanVersions(id),
  ]);

  if (!planData) {
    notFound();
  }

  let contentToRender: LessonPlanContent = planData.content;
  let activeVersionNumber = versions[0]?.versionNumber || 1;

  if (v) {
    const targetVersionNum = parseInt(v, 10);
    const foundVersion = versions.find((ver) => ver.versionNumber === targetVersionNum);
    if (foundVersion) {
      contentToRender = foundVersion.content;
      activeVersionNumber = foundVersion.versionNumber;
    }
  }

  const identity = contentToRender?.identity;
  const competencies = contentToRender?.competencies;
  const activities = contentToRender?.activities;
  const assessments = contentToRender?.assessments;
  const followUp = contentToRender?.followUp;
  const reflection = contentToRender?.reflection;

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Detail RPP: ${planData.title}`}
        subtitle={`Penyusun: ${planData.teacherName} • Kelas ${planData.classroomName} • ${planData.subjectName}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/rpp"
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 transition"
            >
              ← Kembali ke Monitoring
            </Link>
            <PrintButton />
          </div>
        }
      />

      <div className="space-y-6">
        {/* Status & Version Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                DOCUMENT_STATUS_BADGE_CLASSES[planData.status as DocumentStatus]
              }`}
            >
              {DOCUMENT_STATUS_LABELS[planData.status as DocumentStatus]}
            </span>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-full">
              Menampilkan Snapshot v{activeVersionNumber}
            </span>
          </div>

          {versions.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Riwayat Versi:</span>
              <div className="flex gap-1.5">
                {versions.map((ver) => (
                  <Link
                    key={ver.id}
                    href={`/admin/rpp/${id}?v=${ver.versionNumber}`}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeVersionNumber === ver.versionNumber
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                    }`}
                  >
                    v{ver.versionNumber} ({new Date(ver.createdAt).toLocaleDateString("id-ID")})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Sheet */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl">
              A. Informasi Umum & Identitas Program
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 block font-medium">Penyusun / Guru</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.teacherName || planData.teacherName}</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Kelas / Fase</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">Kelas {identity?.classroomName} ({identity?.phase})</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Mata Pelajaran</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.subjectName} ({identity?.subjectCode})</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Materi / Topik</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.topic}</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Alokasi Waktu</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.timeAllocation}</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Model & Metode</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.learningModel || "-"}</span>
              </div>
            </div>
          </div>

          {/* Kompetensi & Tujuan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl">
              B. Capaian & Tujuan Pembelajaran
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Kompetensi Awal:</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {competencies?.initialCompetencies || "-"}
                </p>
              </div>
              {competencies?.learningAchievements && (
                <div>
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Capaian Pembelajaran (CP):</span>
                  <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                    {competencies.learningAchievements}
                  </p>
                </div>
              )}
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Tujuan Pembelajaran (TP):</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {competencies?.learningObjectives || planData.title || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Skenario Kegiatan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl">
              C. Skenario Kegiatan Pembelajaran
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">1. Pendahuluan ({activities?.opening?.timeAllocation || "10 Menit"})</span>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{activities?.opening?.description || "-"}</p>
              </div>
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">2. Kegiatan Inti ({activities?.core?.timeAllocation || "50 Menit"})</span>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{activities?.core?.description || "-"}</p>
              </div>
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">3. Penutup ({activities?.closing?.timeAllocation || "10 Menit"})</span>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{activities?.closing?.description || "-"}</p>
              </div>
            </div>
          </div>

          {/* Asesmen & Diferensiasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                D. Asesmen & Instrumen
              </h3>
              <div className="space-y-2">
                <p><strong>Formatif:</strong> {assessments?.formativeAssessment || "-"}</p>
                <p><strong>Sumatif:</strong> {assessments?.summativeAssessment || "-"}</p>
                {assessments?.assessmentCriteria && (
                  <div>
                    <strong className="block mb-0.5">Kriteria (KKTP):</strong>
                    <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400 pl-2 border-l border-zinc-300 dark:border-zinc-700">
                      {assessments.assessmentCriteria}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                E. Diferensiasi & Remedial/Pengayaan
              </h3>
              <div className="space-y-2">
                <p><strong>Remedial:</strong> {followUp?.remedial || "-"}</p>
                <p><strong>Pengayaan:</strong> {followUp?.enrichment || "-"}</p>
                <p><strong>Refleksi Guru:</strong> {reflection?.teacherReflection || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
