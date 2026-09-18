import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  getTeachingModuleById,
  getTeachingModuleVersions,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DocumentStatus,
  TeachingModuleContent,
} from "@/lib/data/teaching-modules";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

export default async function TeachingModulePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const user = await requireRole("GURU");
  const { id } = await params;
  const { v } = await searchParams;

  const [moduleData, versions] = await Promise.all([
    getTeachingModuleById(id, user.schoolId),
    getTeachingModuleVersions(id),
  ]);

  if (!moduleData || moduleData.teacherUserId !== user.id) {
    notFound();
  }

  // If a specific version number is requested, render that snapshot
  let contentToRender: TeachingModuleContent = moduleData.content;
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
  const components = contentToRender?.learningComponents;
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
              href={`/guru/modul-ajar/${id}`}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 transition"
            >
              ← Kembali ke Form Edit
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  DOCUMENT_STATUS_BADGE_CLASSES[moduleData.status as DocumentStatus]
                }`}
              >
                {DOCUMENT_STATUS_LABELS[moduleData.status as DocumentStatus]}
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
                      href={`/guru/modul-ajar/${id}/preview?v=${ver.versionNumber}`}
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
              href={`/guru/modul-ajar/${id}`}
              className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-semibold transition"
            >
              ✏️ Edit Dokumen
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
            MODUL AJAR KURIKULUM MERDEKA
          </h1>
          <h2 className="text-sm font-bold uppercase text-zinc-700">
            {identity?.schoolName || "SEKOLAH DASAR"}
          </h2>
          <p className="text-xs text-zinc-500">
            Tahun Ajaran {identity?.academicYearName} • {identity?.semesterName}
          </p>
        </header>

        {/* 1. INFORMASI UMUM */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            A. IDENTITAS MODUL
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="font-semibold text-zinc-600">Penyusun / Guru:</span>
              <p className="font-bold text-zinc-900">{identity?.teacherName || moduleData.teacherName}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Instansi:</span>
              <p className="font-bold text-zinc-900">{identity?.schoolName}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Mata Pelajaran:</span>
              <p className="font-bold text-zinc-900">{identity?.subjectName} ({identity?.subjectCode})</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Fase / Kelas:</span>
              <p className="font-bold text-zinc-900">{identity?.phase} / Kelas {identity?.classroomName}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Topik / Materi:</span>
              <p className="font-bold text-zinc-900">{identity?.topic}</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-600">Alokasi Waktu:</span>
              <p className="font-bold text-zinc-900">{identity?.timeAllocation}</p>
            </div>
            {identity?.subTopic && (
              <div>
                <span className="font-semibold text-zinc-600">Sub-Topik:</span>
                <p className="text-zinc-900">{identity?.subTopic}</p>
              </div>
            )}
            {identity?.learningModel && (
              <div>
                <span className="font-semibold text-zinc-600">Model Pembelajaran:</span>
                <p className="text-zinc-900">{identity?.learningModel}</p>
              </div>
            )}
          </div>
        </section>

        {/* 2. PROFIL PELAJAR PANCASILA & KOMPETENSI AWAL */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            B. KOMPONEN AWAL & PROFIL PANCASILA
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">1. Kompetensi Awal:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {components?.initialCompetencies || "-"}
              </p>
            </div>

            {components?.pancasilaProfile && components.pancasilaProfile.length > 0 && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">2. Profil Pelajar Pancasila:</h4>
                <ul className="list-disc list-inside pl-3 space-y-0.5 text-zinc-700">
                  {components.pancasilaProfile.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">3. Media, Alat & Bahan:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {components?.mediaAndTools || "-"}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">4. Sumber Belajar:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {components?.learningSources || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TUJUAN & MATERI */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            C. TUJUAN & MATERI PEMBELAJARAN
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">1. Tujuan Pembelajaran (TP):</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {components?.learningObjectives || moduleData.learningObjectives || "-"}
              </p>
            </div>

            {components?.meaningfulUnderstanding && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">2. Pemahaman Bermakna:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {components.meaningfulUnderstanding}
                </p>
              </div>
            )}

            {components?.triggerQuestions && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">3. Pertanyaan Pemantik:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {components.triggerQuestions}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-zinc-800 mb-1">4. Materi Pokok:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {components?.learningMaterials || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 4. LANGKAH KEGIATAN */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            D. URUTAN LANGKAH KEGIATAN PEMBELAJARAN
          </h3>
          <div className="space-y-4 text-xs">
            <div className="border border-zinc-200 rounded p-3 space-y-1">
              <h4 className="font-bold text-zinc-900">1. Kegiatan Pendahuluan</h4>
              <p className="text-zinc-700 whitespace-pre-line">
                {activities?.openingActivities || "-"}
              </p>
            </div>

            <div className="border border-zinc-200 rounded p-3 space-y-1">
              <h4 className="font-bold text-zinc-900">2. Kegiatan Inti</h4>
              <p className="text-zinc-700 whitespace-pre-line">
                {activities?.coreActivities || "-"}
              </p>
            </div>

            <div className="border border-zinc-200 rounded p-3 space-y-1">
              <h4 className="font-bold text-zinc-900">3. Kegiatan Penutup</h4>
              <p className="text-zinc-700 whitespace-pre-line">
                {activities?.closingActivities || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 5. ASESMEN & RUBRIK */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            E. ASESMEN & KRITERIA KETERCAPAIAN
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

            {assessments?.rubricAndCriteria && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">4. Rubrik & Kriteria Penilaian:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {assessments.rubricAndCriteria}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 6. DIFERENSIASI & TINDAK LANJUT */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            F. PEMBELAJARAN BERDIFERENSIASI & TINDAK LANJUT
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
              <h4 className="font-bold text-zinc-800 mb-1">Refleksi Guru:</h4>
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

        {/* 8. LAMPIRAN & REFERENSI */}
        {(attachments?.studentWorksheetOverview ||
          attachments?.readingMaterials ||
          attachments?.glossary ||
          attachments?.bibliography) && (
          <section className="mb-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
              H. LAMPIRAN
            </h3>
            <div className="space-y-3 text-xs">
              {attachments.studentWorksheetOverview && (
                <div>
                  <h4 className="font-bold text-zinc-800 mb-1">1. Ringkasan LKPD:</h4>
                  <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                    {attachments.studentWorksheetOverview}
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

        {/* Signature Area for Print */}
        <footer className="pt-8 mt-12 border-t border-zinc-200 grid grid-cols-2 text-xs text-center">
          <div className="space-y-16">
            <p>Mengetahui,<br />Kepala Sekolah</p>
            <div>
              <p className="font-bold underline uppercase">( ............................................ )</p>
              <p className="text-[11px] text-zinc-500">NIP. ........................................</p>
            </div>
          </div>

          <div className="space-y-16">
            <p>Guru Kelas / Mata Pelajaran</p>
            <div>
              <p className="font-bold underline uppercase">
                {identity?.teacherName || moduleData.teacherName}
              </p>
              <p className="text-[11px] text-zinc-500">
                NIP/NUPTK: {moduleData.teacherEmployeeNumber || "-"}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
