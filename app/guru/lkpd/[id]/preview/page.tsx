import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  getWorksheetById,
  getWorksheetVersions,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DocumentStatus,
  WorksheetContent,
  WORKSHEET_ACTIVITY_TYPE_LABELS,
} from "@/lib/data/worksheets";
import Link from "next/link";
import { PrintButton } from "@/app/guru/modul-ajar/[id]/preview/PrintButton";

export default async function WorksheetPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const user = await requireRole("GURU");
  const { id } = await params;
  const { v } = await searchParams;

  const [worksheetData, versions] = await Promise.all([
    getWorksheetById(id, user.schoolId),
    getWorksheetVersions(id),
  ]);

  if (!worksheetData || worksheetData.teacherUserId !== user.id) {
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

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 font-sans">
      {/* Header Controls (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href={`/guru/lkpd/${id}`}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 transition"
            >
              ← Kembali ke Form Edit
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  DOCUMENT_STATUS_BADGE_CLASSES[worksheetData.status as DocumentStatus]
                }`}
              >
                {DOCUMENT_STATUS_LABELS[worksheetData.status as DocumentStatus]}
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
                      href={`/guru/lkpd/${id}/preview?v=${ver.versionNumber}`}
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
              href={`/guru/lkpd/${id}`}
              className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-semibold transition"
            >
              ✏️ Edit LKPD
            </Link>

            <PrintButton />
          </div>
        </div>
      </div>

      {/* Printable Sheet */}
      <main className="max-w-4xl mx-auto bg-white text-zinc-900 border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop LKPD */}
        <header className="border-b-2 border-zinc-900 pb-4 mb-6 text-center space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {identity?.schoolName || "SEKOLAH DASAR"}
          </h2>
          <h1 className="text-base font-extrabold uppercase tracking-wide">
            {instructions?.worksheetTitle || "LEMBAR KERJA PESERTA DIDIK (LKPD)"}
          </h1>
          <p className="text-xs text-zinc-600 font-medium">
            Tahun Ajaran {identity?.academicYearName} • {identity?.semesterName}
          </p>
        </header>

        {/* Identity & Student Name Header Box */}
        <div className="grid grid-cols-2 gap-4 border border-zinc-900 rounded p-3 mb-6 text-xs">
          <div className="space-y-1">
            <p><span className="font-semibold">Mata Pelajaran:</span> {identity?.subjectName} ({identity?.subjectCode})</p>
            <p><span className="font-semibold">Kelas / Fase:</span> Kelas {identity?.classroomName} ({identity?.phase})</p>
            <p><span className="font-semibold">Topik:</span> {identity?.topic} {identity?.subTopic ? `• ${identity?.subTopic}` : ""}</p>
            <p><span className="font-semibold">Alokasi Waktu:</span> {identity?.timeAllocation}</p>
          </div>
          <div className="space-y-2 border-l border-zinc-300 pl-4">
            <div>
              <span className="font-semibold block">Nama Kelompok / Siswa:</span>
              <p className="border-b border-dotted border-zinc-600 pt-1 text-zinc-400">1. ....................................................................</p>
              <p className="border-b border-dotted border-zinc-600 pt-1 text-zinc-400">2. ....................................................................</p>
              <p className="border-b border-dotted border-zinc-600 pt-1 text-zinc-400">3. ....................................................................</p>
              <p className="border-b border-dotted border-zinc-600 pt-1 text-zinc-400">4. ....................................................................</p>
            </div>
          </div>
        </div>

        {/* 1. PETUNJUK & TUJUAN */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            A. PETUNJUK & TUJUAN KEGIATAN
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">1. Petunjuk Pengerjaan:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {instructions?.generalInstructions || "-"}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-zinc-800 mb-1">2. Tujuan Kegiatan:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {instructions?.activityObjectives || "-"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">3. Alat dan Bahan:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {instructions?.toolsAndMaterials || "-"}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">4. Sumber Belajar:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {instructions?.learningSources || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. MATERI SINGKAT */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            B. MATERI RINGKAS
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">Pengantar Materi:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {briefMaterial?.introductoryMaterial || "-"}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-zinc-800 mb-1">Konsep Kunci:</h4>
              <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                {briefMaterial?.keyConcepts || "-"}
              </p>
            </div>
            {briefMaterial?.examplesOrIllustrations && (
              <div>
                <h4 className="font-bold text-zinc-800 mb-1">Contoh & Ilustrasi:</h4>
                <p className="text-zinc-700 whitespace-pre-line pl-3 border-l-2 border-zinc-200">
                  {briefMaterial.examplesOrIllustrations}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 3. AKTIVITAS SISWA */}
        {activities.length > 0 && (
          <section className="mb-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
              C. LANGKAH KERJA & AKTIVITAS SISWA
            </h3>
            <div className="space-y-4 text-xs">
              {activities.map((act, index) => (
                <div key={act.id} className="border border-zinc-200 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center font-bold text-zinc-900 border-b border-zinc-100 pb-1">
                    <span>Aktivitas {index + 1}: {act.title}</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-zinc-100 border">
                      {WORKSHEET_ACTIVITY_TYPE_LABELS[act.type]}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-zinc-700 mb-0.5">Langkah Pengerjaan:</h5>
                    <p className="text-zinc-800 whitespace-pre-line pl-2">{act.instruction}</p>
                  </div>
                  {act.expectedOutput && (
                    <div className="pt-1 text-[11px] text-zinc-600">
                      <span className="font-semibold">Format Hasil:</span> {act.expectedOutput}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. PERTANYAAN & TUGAS */}
        {questions.length > 0 && (
          <section className="mb-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
              D. LEMBAR SOAL & PERTANYAAN DISKUSI
            </h3>
            <div className="space-y-4 text-xs">
              {questions.map((q, index) => (
                <div key={q.id} className="border border-zinc-200 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center font-bold text-zinc-900">
                    <span>{index + 1}. {q.question}</span>
                    <span className="text-zinc-400 font-normal text-[11px]">({q.points || 10} Poin)</span>
                  </div>

                  {q.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-zinc-400 flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "SHORT_ANSWER" && (
                    <div className="pt-2">
                      <p className="text-zinc-400 border-b border-dotted border-zinc-400 pb-1">
                        Jawaban: ........................................................................................................................................................
                      </p>
                    </div>
                  )}

                  {q.type === "ESSAY" && (
                    <div className="pt-2 space-y-2">
                      <p className="text-zinc-300 border-b border-dotted border-zinc-400 pb-1">.</p>
                      <p className="text-zinc-300 border-b border-dotted border-zinc-400 pb-1">.</p>
                      <p className="text-zinc-300 border-b border-dotted border-zinc-400 pb-1">.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. REFLEKSI SISWA */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            E. REFLEKSI PESERTA DIDIK
          </h3>
          <div className="border border-zinc-200 rounded p-3 space-y-2 text-xs">
            <p>1. Apa hal paling menarik yang kamu pelajari hari ini? <br /><span className="text-zinc-400">........................................................................................................................................................</span></p>
            <p>2. Bagian mana yang masih membuatmu bingung? <br /><span className="text-zinc-400">........................................................................................................................................................</span></p>
            <p>3. Bagaimana perasaanmu setelah menyelesaikan lembar kerja ini? ( 😊 Senang / 😐 Biasa / 🙁 Sulit )</p>
          </div>
        </section>

        {/* 6. RUBRIK & PENILAIAN GURU */}
        <section className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-100 p-2 rounded border-l-4 border-zinc-800">
            F. KRITERIA PENILAIAN & CATATAN GURU
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs border border-zinc-200 rounded p-3">
            <div>
              <span className="font-bold block mb-1">Kriteria Penilaian:</span>
              <p className="text-zinc-700 whitespace-pre-line">{assessment?.assessmentCriteria || "-"}</p>
            </div>
            <div className="border-l border-zinc-200 pl-3">
              <span className="font-bold block mb-1">Nilai & Paraf Guru:</span>
              <div className="pt-4 flex justify-between items-center">
                <span className="text-zinc-400">Skor: ____ / {assessment?.maxScore || 100}</span>
                <span className="text-zinc-400">Paraf: ( ............ )</span>
              </div>
            </div>
          </div>
        </section>

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
            <p>Guru Kelas / Mata Pelajaran</p>
            <div>
              <p className="font-bold underline uppercase">
                {identity?.teacherName || worksheetData.teacherName}
              </p>
              <p className="text-[11px] text-zinc-500">
                NIP/NUPTK: {worksheetData.teacherEmployeeNumber || "-"}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
