import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getWorksheetById,
  getWorksheetVersions,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DocumentStatus,
  WorksheetContent,
  WORKSHEET_ACTIVITY_TYPE_LABELS,
} from "@/lib/data/worksheets";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";
import { PrintButton } from "@/app/guru/modul-ajar/[id]/preview/PrintButton";

export default async function AdminWorksheetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const { id } = await params;
  const { v } = await searchParams;

  const [worksheetData, versions] = await Promise.all([
    getWorksheetById(id, user.schoolId),
    getWorksheetVersions(id),
  ]);

  if (!worksheetData) {
    notFound();
  }

  let contentToRender: WorksheetContent = worksheetData.content;
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
  const instructions = contentToRender?.instructionsAndObjectives;
  const briefMaterial = contentToRender?.briefMaterial;
  const activities = contentToRender?.activities || [];
  const questions = contentToRender?.questions || [];
  const assessment = contentToRender?.assessmentAndRubric;
  const reflection = contentToRender?.reflection;

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Detail LKPD: ${worksheetData.title}`}
        subtitle={`Penyusun: ${worksheetData.teacherName} • Kelas ${worksheetData.classroomName} • ${worksheetData.subjectName}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/lkpd"
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
                DOCUMENT_STATUS_BADGE_CLASSES[worksheetData.status as DocumentStatus]
              }`}
            >
              {DOCUMENT_STATUS_LABELS[worksheetData.status as DocumentStatus]}
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
                    href={`/admin/lkpd/${id}?v=${ver.versionNumber}`}
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
              A. Informasi Umum & Identitas LKPD
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 block font-medium">Penyusun / Guru</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.teacherName || worksheetData.teacherName}</span>
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
                <span className="text-zinc-400 block font-medium">Topik / Sub-Topik</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.topic} {identity?.subTopic ? `(${identity?.subTopic})` : ""}</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Alokasi Waktu</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.timeAllocation}</span>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium">Bentuk Pengerjaan</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{identity?.groupType || "Kelompok"}</span>
              </div>
            </div>
          </div>

          {/* Petunjuk & Tujuan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl">
              B. Petunjuk & Tujuan Aktivitas
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Petunjuk Pengerjaan:</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {instructions?.generalInstructions || "-"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Tujuan Aktivitas:</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {instructions?.activityObjectives || "-"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Alat & Bahan:</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {instructions?.toolsAndMaterials || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Materi Ringkas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl">
              C. Materi Pengantar Ringkas
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Materi Pengantar:</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {briefMaterial?.introductoryMaterial || "-"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Konsep Kunci:</span>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {briefMaterial?.keyConcepts || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Aktivitas & Soal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                D. Aktivitas ({activities.length})
              </h3>
              <div className="space-y-3">
                {activities.map((act, idx) => (
                  <div key={act.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {idx + 1}. {act.title} ({WORKSHEET_ACTIVITY_TYPE_LABELS[act.type]})
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line pl-2">{act.instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                E. Pertanyaan & Soal ({questions.length})
              </h3>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {idx + 1}. {q.question} ({q.points || 10} Poin)
                    </span>
                    {q.answerKey && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pl-2">
                        Kunci: {q.answerKey}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Asesmen & Refleksi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
            <div className="space-y-3">
              <h3 className="font-bold uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                F. Penilaian & Rubrik
              </h3>
              <div className="space-y-2">
                <p><strong>Kriteria:</strong> {assessment?.assessmentCriteria || "-"}</p>
                <p><strong>Skor Maksimal:</strong> {assessment?.maxScore || 100}</p>
                <p><strong>Rubrik:</strong> {assessment?.simpleRubric || "-"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                G. Refleksi Guru
              </h3>
              <div className="space-y-2">
                <p><strong>Ketercapaian:</strong> {reflection?.teacherReflection?.activityAchievement || "-"}</p>
                <p><strong>Tindak Lanjut:</strong> {reflection?.teacherReflection?.followUp || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
