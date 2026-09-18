import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  getLessonPlanById,
  getLessonPlanVersions,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DocumentStatus,
  LessonPlanContent,
} from "@/lib/data/lesson-plans";
import Link from "next/link";
import { PrintButton } from "@/app/guru/modul-ajar/[id]/preview/PrintButton";

export default async function LessonPlanPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const user = await requireRole("GURU");
  const { id } = await params;
  const { v } = await searchParams;

  const [planData, versions] = await Promise.all([
    getLessonPlanById(id, user.schoolId),
    getLessonPlanVersions(id),
  ]);

  if (!planData || planData.teacherUserId !== user.id) {
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
  const underAndTrig = contentToRender?.understandingAndTrigger;
  const mediaAndSources = contentToRender?.mediaAndSources;
  const activities = contentToRender?.activities;
  const assessments = contentToRender?.assessments;
  const diff = contentToRender?.differentiation;
  const followUp = contentToRender?.followUp;
  const reflection = contentToRender?.reflection;
  const attachments = contentToRender?.attachments;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 font-sans">
      {/* Non-Printable Header & Navigation Bar */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href={`/guru/rpp/${id}`}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 transition"
            >
              ← Kembali ke Form Edit
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  DOCUMENT_STATUS_BADGE_CLASSES[planData.status as DocumentStatus]
                }`}
              >
                {DOCUMENT_STATUS_LABELS[planData.status as DocumentStatus]}
              </span>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                Snapshot v{activeVersionNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {versions.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span>Versi:</span>
                <div className="flex gap-1">
                  {versions.map((ver) => (
                    <Link
                      key={ver.id}
                      href={`/guru/rpp/${id}/preview?v=${ver.versionNumber}`}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        activeVersionNumber === ver.versionNumber
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                      }`}
                    >
                      v{ver.versionNumber}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={`/guru/rpp/${id}`}
              className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-semibold transition"
            >
              ✏️ Edit RPP
            </Link>

            <PrintButton />
          </div>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <main className="max-w-4xl mx-auto bg-white text-zinc-900 border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Document Header / Kop */}
        <header className="border-b-2 border-zinc-900 pb-4 mb-6 text-center space-y-1">
          <h1 className="text-base font-extrabold uppercase tracking-wide">
            RENCANA PELAKSANAAN PEMBELAJARAN (RPP)
          </h1>
          <h2 className="text-sm font-bold uppercase text-zinc-700">
            {identity?.schoolName || "SEKOLAH DASAR"}
          </h2>
          <p className="text-xs text-zinc-500">
            Tahun Ajaran {identity?.academicYearName} • {identity?.semesterName}
          </p>
        </header>

        {/* 1. IDENTITAS */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            A. IDENTITAS PROGRAM PEMBELAJARAN
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="font-semibold text-zinc-600">Nama Sekolah:</span>
              <p className="font-bold text-zinc-900">{identity?.schoolName}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Guru Pengampu:</span>
              <p className="font-bold text-zinc-900">{identity?.teacherName || planData.teacherName}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Mata Pelajaran:</span>
              <p className="font-bold text-zinc-900">{identity?.subjectName} ({identity?.subjectCode})</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Kelas / Fase:</span>
              <p className="font-bold text-zinc-900">{identity?.phase} / Kelas {identity?.classroomName}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Materi Pokok / Topik:</span>
              <p className="font-bold text-zinc-900">{identity?.topic}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Alokasi Waktu:</span>
              <p className="font-bold text-zinc-900">{identity?.timeAllocation}</p>
            </div>
            {identity?.subTopic && (
              <div>
                <span className="font-semibold text-zinc-600">Sub-Materi:</span>
                <p className="text-zinc-900">{identity?.subTopic}</p>
              </div>
            )}
            {identity?.learningModel && (
              <div>
                <span className="font-semibold text-zinc-600">Model / Metode:</span>
                <p className="text-zinc-900">{identity?.learningModel} {identity?.learningMethod ? `• ${identity?.learningMethod}` : ""}</p>
              </div>
            )}
          </div>
        </section>

        {/* 2. KOMPETENSI & TUJUAN */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            B. CAPAIAN & TUJUAN PEMBELAJARAN
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">1. Kompetensi Awal:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {competencies?.initialCompetencies || "-"}
              </p>
            </div>

            {competencies?.learningAchievements && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">2. Capaian Pembelajaran (CP):</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {competencies.learningAchievements}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-zinc-800 mb-1">3. Tujuan Pembelajaran (TP):</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {competencies?.learningObjectives || planData.title || "-"}
              </p>
            </div>

            {competencies?.pancasilaProfile && competencies.pancasilaProfile.length > 0 && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">4. Profil Pelajar Pancasila:</h4>
                <ul className="list-disc list-inside pl-3 space-y-0.5 text-zinc-700">
                  {competencies.pancasilaProfile.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* 3. MEDIA & SUMBER */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            C. MEDIA, ALAT, DAN SUMBER BELAJAR
          </h3>
          <div className="space-y-3 text-xs">
            {underAndTrig?.meaningfulUnderstanding && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">1. Pemahaman Bermakna:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {underAndTrig.meaningfulUnderstanding}
                </p>
              </div>
            )}

            {underAndTrig?.triggerQuestions && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">2. Pertanyaan Pemantik:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {underAndTrig.triggerQuestions}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-zinc-800 mb-1">3. Materi Pokok Pembelajaran:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {mediaAndSources?.learningMaterials || "-"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">4. Media & Alat Peraga:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {mediaAndSources?.mediaAndTools || "-"}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">5. Sumber Belajar:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {mediaAndSources?.learningSources || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LANGKAH KEGIATAN PEMBELAJARAN */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            D. SKENARIO KEGIATAN PEMBELAJARAN
          </h3>
          <div className="space-y-4 text-xs">
            {/* Pendahuluan */}
            <div className="border border-zinc-200 rounded p-3 space-y-2">
              <div className="flex justify-between items-center font-bold text-zinc-900 border-b border-zinc-100 pb-1">
                <span>1. Kegiatan Pendahuluan</span>
                <span className="text-zinc-500 font-normal">({activities?.opening?.timeAllocation || "10 Menit"})</span>
              </div>
              <p className="text-zinc-700 whitespace-pre-line">
                {activities?.opening?.description || "-"}
              </p>
            </div>

            {/* Inti */}
            <div className="border border-zinc-200 rounded p-3 space-y-2">
              <div className="flex justify-between items-center font-bold text-zinc-900 border-b border-zinc-100 pb-1">
                <span>2. Kegiatan Inti</span>
                <span className="text-zinc-500 font-normal">({activities?.core?.timeAllocation || "50 Menit"})</span>
              </div>
              <p className="text-zinc-700 whitespace-pre-line">
                {activities?.core?.description || "-"}
              </p>
            </div>

            {/* Penutup */}
            <div className="border border-zinc-200 rounded p-3 space-y-2">
              <div className="flex justify-between items-center font-bold text-zinc-900 border-b border-zinc-100 pb-1">
                <span>3. Kegiatan Penutup</span>
                <span className="text-zinc-500 font-normal">({activities?.closing?.timeAllocation || "10 Menit"})</span>
              </div>
              <p className="text-zinc-700 whitespace-pre-line">
                {activities?.closing?.description || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 5. ASESMEN & KRITERIA PENILAIAN */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            E. ASESMEN & KRITERIA KETERCAPAIAN (KKTP)
          </h3>
          <div className="space-y-3 text-xs">
            {assessments?.diagnosticAssessment && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">1. Asesmen Diagnostik:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {assessments.diagnosticAssessment}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-zinc-800 mb-1">2. Asesmen Formatif:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {assessments?.formativeAssessment || "-"}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-zinc-800 mb-1">3. Asesmen Sumatif:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {assessments?.summativeAssessment || "-"}
              </p>
            </div>

            {assessments?.assessmentInstruments && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">4. Instrumen Penilaian:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {assessments.assessmentInstruments}
                </p>
              </div>
            )}

            {assessments?.assessmentCriteria && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">5. Kriteria Ketercapaian (KKTP):</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {assessments.assessmentCriteria}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 6. DIFERENSIASI & TINDAK LANJUT */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            F. PEMBELAJARAN BERDIFERENSIASI, REMEDIAL & PENGAYAAN
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
            <div className="border border-zinc-200 rounded p-2.5">
              <span className="font-bold text-zinc-800 block mb-1">Diferensiasi Konten:</span>
              <p className="text-zinc-700 whitespace-pre-line text-[11px]">
                {diff?.contentDifferentiation || "-"}
              </p>
            </div>
            <div className="border border-zinc-200 rounded p-2.5">
              <span className="font-bold text-zinc-800 block mb-1">Diferensiasi Proses:</span>
              <p className="text-zinc-700 whitespace-pre-line text-[11px]">
                {diff?.processDifferentiation || "-"}
              </p>
            </div>
            <div className="border border-zinc-200 rounded p-2.5">
              <span className="font-bold text-zinc-800 block mb-1">Diferensiasi Produk:</span>
              <p className="text-zinc-700 whitespace-pre-line text-[11px]">
                {diff?.productDifferentiation || "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">Kegiatan Remedial:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {followUp?.remedial || "-"}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">Kegiatan Pengayaan:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {followUp?.enrichment || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 7. REFLEKSI */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            G. REFLEKSI GURU & SISWA
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">Refleksi Pendidik (Guru):</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {reflection?.teacherReflection || "-"}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">Refleksi Peserta Didik:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {reflection?.studentReflection || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 8. LAMPIRAN */}
        {(attachments?.worksheetOverview ||
          attachments?.readingMaterials ||
          attachments?.glossary ||
          attachments?.bibliography) && (
          <section className="mb-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
              H. LAMPIRAN
            </h3>
            <div className="space-y-3 text-xs">
              {attachments.worksheetOverview && (
                <div>
                  <h4 className="font-bold text-zinc-800 mb-1">1. Ringkasan LKPD:</h4>
                  <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                    {attachments.worksheetOverview}
                  </p>
                </div>
              )}
              {attachments.readingMaterials && (
                <div>
                  <h4 className="font-bold text-zinc-800 mb-1">2. Bahan Bacaan:</h4>
                  <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                    {attachments.readingMaterials}
                  </p>
                </div>
              )}
              {attachments.glossary && (
                <div>
                  <h4 className="font-bold text-zinc-800 mb-1">3. Glosarium:</h4>
                  <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                    {attachments.glossary}
                  </p>
                </div>
              )}
              {attachments.bibliography && (
                <div>
                  <h4 className="font-bold text-zinc-800 mb-1">4. Daftar Pustaka:</h4>
                  <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                    {attachments.bibliography}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Signature Area */}
        <footer className="pt-8 mt-12 border-t border-zinc-200 grid grid-cols-2 text-xs text-center">
          <div className="space-y-16">
            <p>Mengetahui,<br />Kepala Sekolah</p>
            <div>
              <p className="font-bold underline uppercase">( ............................................ )</p>
              <p className="text-[11px] text-zinc-500">NIP. ........................................</p>
            </div>
          </div>

          <div className="space-y-16">
            <p>Guru Mata Pelajaran / Kelas</p>
            <div>
              <p className="font-bold underline uppercase">
                {identity?.teacherName || planData.teacherName}
              </p>
              <p className="text-[11px] text-zinc-500">
                NIP/NUPTK: {planData.teacherEmployeeNumber || "-"}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
