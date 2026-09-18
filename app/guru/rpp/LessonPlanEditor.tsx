"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createLessonPlanAction,
  updateLessonPlanAction,
  publishLessonPlanAction,
  deactivateLessonPlanAction,
} from "./actions";
import {
  DocumentStatus,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DOCUMENT_STATUS_LABELS,
  getPhaseByGradeLevel,
} from "@/lib/data/lesson-plans";
import {
  ClassroomOption,
  SubjectOption,
  AcademicYearOption,
  SemesterOption,
} from "../modul-ajar/TeachingModuleEditor";

export interface LessonPlanFormData {
  id?: string;
  title: string;
  topic: string;
  subTopic: string;
  classroomId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
  status: DocumentStatus;
  timeAllocation: string;
  targetStudents: string;
  learningModel: string;
  learningMethod: string;
  learningApproach: string;
  initialCompetencies: string;
  learningAchievements: string;
  learningObjectives: string;
  pancasilaProfile: string[];
  meaningfulUnderstanding: string;
  triggerQuestions: string;
  learningMaterials: string;
  mediaAndTools: string;
  learningSources: string;
  openingOrientation: string;
  openingApperception: string;
  openingMotivation: string;
  openingDescription: string;
  openingTime: string;
  coreExploration: string;
  coreElaboration: string;
  coreDiscussionOrPractice: string;
  coreApplication: string;
  coreDescription: string;
  coreTime: string;
  closingReflection: string;
  closingSummary: string;
  closingFollowUp: string;
  closingDescription: string;
  closingTime: string;
  meetingNotes: string;
  diagnosticAssessment: string;
  formativeAssessment: string;
  summativeAssessment: string;
  assessmentInstruments: string;
  assessmentCriteria: string;
  contentDifferentiation: string;
  processDifferentiation: string;
  productDifferentiation: string;
  remedial: string;
  enrichment: string;
  teacherReflection: string;
  studentReflection: string;
  worksheetOverview: string;
  readingMaterials: string;
  glossary: string;
  bibliography: string;
}

const PANCASILA_PROFILE_OPTIONS = [
  "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
  "Berkebinekaan Global",
  "Bergotong Royong",
  "Mandiri",
  "Bernalar Kritis",
  "Kreatif",
];

export function LessonPlanEditor({
  initialData,
  classrooms,
  subjects,
  academicYears,
  semesters,
  isEdit = false,
  versions = [],
}: {
  initialData?: Partial<LessonPlanFormData>;
  classrooms: ClassroomOption[];
  subjects: SubjectOption[];
  academicYears: AcademicYearOption[];
  semesters: SemesterOption[];
  isEdit?: boolean;
  versions?: {
    id: string;
    versionNumber: number;
    createdAt: Date;
    createdByName: string;
  }[];
}) {
  const router = useRouter();

  const [formData, setFormData] = useState<LessonPlanFormData>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    topic: initialData?.topic || "",
    subTopic: initialData?.subTopic || "",
    classroomId: initialData?.classroomId || (classrooms[0]?.id || ""),
    subjectId: initialData?.subjectId || (subjects[0]?.id || ""),
    academicYearId: initialData?.academicYearId || (academicYears[0]?.id || ""),
    semesterId: initialData?.semesterId || (semesters[0]?.id || ""),
    status: (initialData?.status as DocumentStatus) || "DRAFT",
    timeAllocation: initialData?.timeAllocation || "2 x 35 Menit (1 Pertemuan)",
    targetStudents: initialData?.targetStudents || "Peserta Didik Reguler / Tipikal (28 Siswa)",
    learningModel: initialData?.learningModel || "Problem-Based Learning (PBL)",
    learningMethod: initialData?.learningMethod || "Ceramah interaktif, tanya jawab, diskusi kelompok, penugasan",
    learningApproach: initialData?.learningApproach || "Saintifik / TPACK",
    initialCompetencies: initialData?.initialCompetencies || "",
    learningAchievements: initialData?.learningAchievements || "",
    learningObjectives: initialData?.learningObjectives || "",
    pancasilaProfile: initialData?.pancasilaProfile || [
      "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
      "Bernalar Kritis",
    ],
    meaningfulUnderstanding: initialData?.meaningfulUnderstanding || "",
    triggerQuestions: initialData?.triggerQuestions || "",
    learningMaterials: initialData?.learningMaterials || "",
    mediaAndTools: initialData?.mediaAndTools || "",
    learningSources: initialData?.learningSources || "",
    openingOrientation: initialData?.openingOrientation || "",
    openingApperception: initialData?.openingApperception || "",
    openingMotivation: initialData?.openingMotivation || "",
    openingDescription: initialData?.openingDescription || "",
    openingTime: initialData?.openingTime || "10 Menit",
    coreExploration: initialData?.coreExploration || "",
    coreElaboration: initialData?.coreElaboration || "",
    coreDiscussionOrPractice: initialData?.coreDiscussionOrPractice || "",
    coreApplication: initialData?.coreApplication || "",
    coreDescription: initialData?.coreDescription || "",
    coreTime: initialData?.coreTime || "50 Menit",
    closingReflection: initialData?.closingReflection || "",
    closingSummary: initialData?.closingSummary || "",
    closingFollowUp: initialData?.closingFollowUp || "",
    closingDescription: initialData?.closingDescription || "",
    closingTime: initialData?.closingTime || "10 Menit",
    meetingNotes: initialData?.meetingNotes || "",
    diagnosticAssessment: initialData?.diagnosticAssessment || "",
    formativeAssessment: initialData?.formativeAssessment || "",
    summativeAssessment: initialData?.summativeAssessment || "",
    assessmentInstruments: initialData?.assessmentInstruments || "",
    assessmentCriteria: initialData?.assessmentCriteria || "",
    contentDifferentiation: initialData?.contentDifferentiation || "",
    processDifferentiation: initialData?.processDifferentiation || "",
    productDifferentiation: initialData?.productDifferentiation || "",
    remedial: initialData?.remedial || "",
    enrichment: initialData?.enrichment || "",
    teacherReflection: initialData?.teacherReflection || "",
    studentReflection: initialData?.studentReflection || "",
    worksheetOverview: initialData?.worksheetOverview || "",
    readingMaterials: initialData?.readingMaterials || "",
    glossary: initialData?.glossary || "",
    bibliography: initialData?.bibliography || "",
  });

  const [activeTab, setActiveTab] = useState<
    | "identity"
    | "competencies"
    | "media"
    | "activities"
    | "assessment"
    | "differentiation"
    | "reflection"
    | "attachments"
    | "versions"
  >("identity");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const availableSemesters = semesters.filter(
    (s) => s.academicYearId === formData.academicYearId
  );

  const selectedClassroom = classrooms.find((c) => c.id === formData.classroomId);
  const calculatedPhase = selectedClassroom
    ? getPhaseByGradeLevel(selectedClassroom.gradeLevel)
    : "Fase A (Kelas 1 - 2 SD)";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePancasila = (item: string) => {
    setFormData((prev) => {
      const exists = prev.pancasilaProfile.includes(item);
      return {
        ...prev,
        pancasilaProfile: exists
          ? prev.pancasilaProfile.filter((p) => p !== item)
          : [...prev.pancasilaProfile, item],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent, overrideStatus?: DocumentStatus) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const submitPayload: LessonPlanFormData = {
      ...formData,
      status: overrideStatus || formData.status,
    };

    try {
      if (isEdit && formData.id) {
        const res = await updateLessonPlanAction(formData.id, submitPayload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal memperbarui RPP.");
        } else {
          setSuccessMessage(`RPP berhasil diperbarui! Versi v${res.versionNumber} telah dibuat.`);
          setFormData((prev) => ({ ...prev, status: submitPayload.status }));
          router.refresh();
        }
      } else {
        const res = await createLessonPlanAction(submitPayload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal menyimpan RPP baru.");
        } else {
          router.push(`/guru/rpp/${res.id}?saved=true`);
        }
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat menyimpan dokumen RPP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const res = await publishLessonPlanAction(formData.id);
      if (res.success) {
        setFormData((prev) => ({ ...prev, status: "PUBLISHED" }));
        setSuccessMessage("RPP berhasil dipublikasikan!");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Gagal mempublikasikan RPP.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mempublikasikan RPP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const res = await deactivateLessonPlanAction(formData.id);
      if (res.success) {
        setShowDeactivateModal(false);
        router.push("/guru/rpp");
      } else {
        setErrorMessage(res.error || "Gagal menghapus RPP.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menonaktifkan RPP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="font-bold ml-4 hover:underline">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="font-bold ml-4 hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/guru/rpp"
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition"
          >
            ← Kembali ke Daftar RPP
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                DOCUMENT_STATUS_BADGE_CLASSES[formData.status]
              }`}
            >
              {DOCUMENT_STATUS_LABELS[formData.status]}
            </span>
            {isEdit && (
              <span className="text-xs text-zinc-500 font-medium">
                {versions.length > 0 ? `Versi ${versions[0].versionNumber}` : "v1"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Helper placeholder */}
          <button
            type="button"
            title="Integrasi perancangan RPP dengan Gemini AI akan aktif pada Task AI mendatang."
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition flex items-center gap-1.5 opacity-90 cursor-help"
          >
            <span>✨</span>
            <span>Generate dengan AI (Segera)</span>
          </button>

          {isEdit && formData.id && (
            <Link
              href={`/guru/rpp/${formData.id}/preview`}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
            >
              📄 Preview & Cetak
            </Link>
          )}

          {isEdit && formData.status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
            >
              🚀 Terbitkan
            </button>
          )}

          <button
            type="button"
            onClick={(e) => handleSubmit(e, "DRAFT")}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-700 hover:bg-zinc-800 text-white transition disabled:opacity-50"
          >
            💾 Simpan Draft
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, formData.status)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui & Simpan Versi" : "Simpan RPP"}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeactivateModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto space-x-1 pb-1 text-xs font-semibold">
        {[
          { id: "identity" as const, label: "1. Identitas & Metode" },
          { id: "competencies" as const, label: "2. Kompetensi & Tujuan" },
          { id: "media" as const, label: "3. Media & Pemantik" },
          { id: "activities" as const, label: "4. Kegiatan Pembelajaran" },
          { id: "assessment" as const, label: "5. Asesmen & KKTP" },
          { id: "differentiation" as const, label: "6. Diferensiasi & Tindak Lanjut" },
          { id: "reflection" as const, label: "7. Refleksi Guru & Siswa" },
          { id: "attachments" as const, label: "8. Lampiran & Referensi" },
          ...(isEdit ? [{ id: "versions" as const, label: `9. Riwayat Versi (${versions.length})` }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2.5 rounded-t-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-900 border-t border-l border-r border-zinc-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 font-bold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        {/* 1. Identitas & Metode */}
        {activeTab === "identity" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              A. Identitas RPP & Pendekatan Pembelajaran
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Judul Rencana Pelaksanaan Pembelajaran (RPP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: RPP IPAS Kelas 4 - Bagian Tubuh Tumbuhan dan Fungsinya"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Materi / Topik Utama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="Contoh: Struktur & Fungsi Akar, Batang, dan Daun"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Sub-Topik / Materi Spesifik (Opsional)
                </label>
                <input
                  type="text"
                  name="subTopic"
                  value={formData.subTopic}
                  onChange={handleInputChange}
                  placeholder="Contoh: Proses Fotosintesis pada Daun Hijau"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Kelas Rombel <span className="text-red-500">*</span>
                </label>
                <select
                  name="classroomId"
                  value={formData.classroomId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name} (Tingkat {c.gradeLevel} SD)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Fase Kurikulum Otomatis: <span className="font-bold text-blue-600">{calculatedPhase}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {availableSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      Semester {sem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Alokasi Waktu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="timeAllocation"
                  value={formData.timeAllocation}
                  onChange={handleInputChange}
                  placeholder="Contoh: 2 x 35 Menit (1 Pertemuan)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Peserta Didik
                </label>
                <input
                  type="text"
                  name="targetStudents"
                  value={formData.targetStudents}
                  onChange={handleInputChange}
                  placeholder="Contoh: Peserta Didik Reguler / Tipikal (28 Siswa)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Model Pembelajaran
                </label>
                <input
                  type="text"
                  name="learningModel"
                  value={formData.learningModel}
                  onChange={handleInputChange}
                  placeholder="Contoh: Problem-Based Learning (PBL) / Discovery Learning"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Metode Pembelajaran
                </label>
                <input
                  type="text"
                  name="learningMethod"
                  value={formData.learningMethod}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pengamatan langsung, diskusi kelompok, tanya jawab, presentasi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Pendekatan Pembelajaran
                </label>
                <input
                  type="text"
                  name="learningApproach"
                  value={formData.learningApproach}
                  onChange={handleInputChange}
                  placeholder="Contoh: Saintifik (5M: Mengamati, Menanya, Mengumpulkan Info, Mengasosiasi, Mengomunikasikan) & TPACK"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Kompetensi & Tujuan */}
        {activeTab === "competencies" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              B. Capaian & Tujuan Pembelajaran
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Kompetensi Awal (Prasyarat) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="initialCompetencies"
                  rows={3}
                  value={formData.initialCompetencies}
                  onChange={handleInputChange}
                  placeholder="Peserta didik telah mengenal jenis-jenis tumbuhan di lingkungan sekitar sekolah dan rumah..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Capaian Pembelajaran (CP)
                </label>
                <textarea
                  name="learningAchievements"
                  rows={3}
                  value={formData.learningAchievements}
                  onChange={handleInputChange}
                  placeholder="Peserta didik mengidentifikasi keterkaitan antara struktur organ tubuh tumbuhan dengan fungsinya serta mengaitkannya dengan kebutuhan hidup tumbuhan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tujuan Pembelajaran (TP) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="learningObjectives"
                  rows={4}
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  placeholder="1. Melalui pengamatan spesimen tumbuhan asli, peserta didik mampu mengidentifikasi 4 bagian utama tumbuhan dengan tepat.
2. Melalui diskusi kelompok, peserta didik mampu menjelaskan fungsi akar dan daun bagi kelangsungan hidup tumbuhan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Dimensi Profil Pelajar Pancasila
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {PANCASILA_PROFILE_OPTIONS.map((dimensi) => {
                    const isChecked = formData.pancasilaProfile.includes(dimensi);
                    return (
                      <label
                        key={dimensi}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-blue-50/70 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200 font-semibold"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePancasila(dimensi)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{dimensi}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Media & Pemantik */}
        {activeTab === "media" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              C. Pemahaman, Pemantik & Media Pembelajaran
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Pemahaman Bermakna
                  </label>
                  <textarea
                    name="meaningfulUnderstanding"
                    rows={3}
                    value={formData.meaningfulUnderstanding}
                    onChange={handleInputChange}
                    placeholder="Tumbuhan memiliki organ yang saling bekerja sama untuk menghasilkan makanan dan oksigen bagi makhluk hidup lainnya..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Pertanyaan Pemantik
                  </label>
                  <textarea
                    name="triggerQuestions"
                    rows={3}
                    value={formData.triggerQuestions}
                    onChange={handleInputChange}
                    placeholder="Mengapa tumbuhan tidak bisa hidup jika akarnya rusak atau daunnya gugur semua?"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Materi Pokok Pembelajaran <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="learningMaterials"
                  rows={4}
                  value={formData.learningMaterials}
                  onChange={handleInputChange}
                  placeholder="1. Bagian utama tumbuhan: Akar, Batang, Daun, Bunga, dan Buah.
2. Fungsi spesifik akar sebagai penyerap air dan penopang tanaman.
3. Proses fotosintesis pada daun berklorofil."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Media, Alat, dan Bahan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="mediaAndTools"
                    rows={3}
                    value={formData.mediaAndTools}
                    onChange={handleInputChange}
                    placeholder="Tumbuhan sawi/seledri dalam wadah air berwarna, kaca pembesar (lup), LKPD kelompok, LCD proyektor..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Sumber Belajar <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="learningSources"
                    rows={3}
                    value={formData.learningSources}
                    onChange={handleInputChange}
                    placeholder="Buku Siswa IPAS Kelas 4 Kurikulum Merdeka Kemdikbudristek, video animasi fotosintesis, kebun sekolah..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Kegiatan Pembelajaran */}
        {activeTab === "activities" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              D. Skenario & Langkah Kegiatan Pembelajaran
            </h3>

            {/* Pendahuluan */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                  1. Kegiatan Pendahuluan
                </h4>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-zinc-400 font-medium">Alokasi Waktu:</label>
                  <input
                    type="text"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleInputChange}
                    className="px-2 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Orientasi:
                  </label>
                  <textarea
                    name="openingOrientation"
                    rows={2}
                    value={formData.openingOrientation}
                    onChange={handleInputChange}
                    placeholder="Salam, berdoa, presensi siswa..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Apersepsi:
                  </label>
                  <textarea
                    name="openingApperception"
                    rows={2}
                    value={formData.openingApperception}
                    onChange={handleInputChange}
                    placeholder="Mengaitkan dengan tanaman di rumah..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Motivasi:
                  </label>
                  <textarea
                    name="openingMotivation"
                    rows={2}
                    value={formData.openingMotivation}
                    onChange={handleInputChange}
                    placeholder="Menyampaikan manfaat belajar materi..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Uraian Lengkap Kegiatan Pendahuluan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="openingDescription"
                  rows={4}
                  value={formData.openingDescription}
                  onChange={handleInputChange}
                  placeholder="1. Guru memberi salam dan menyapa peserta didik dengan ramah.
2. Salah satu peserta didik memimpin doa bersama.
3. Guru memeriksa kehadiran siswa dan kesiapan ruang belajar.
4. Guru mengajukan pertanyaan pemantik mengenai tanaman di halaman sekolah.
5. Guru menyampaikan tujuan pembelajaran hari ini."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Kegiatan Inti */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                  2. Kegiatan Inti Pembelajaran
                </h4>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-zinc-400 font-medium">Alokasi Waktu:</label>
                  <input
                    type="text"
                    name="coreTime"
                    value={formData.coreTime}
                    onChange={handleInputChange}
                    className="px-2 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Eksplorasi Konsep:
                  </label>
                  <textarea
                    name="coreExploration"
                    rows={2}
                    value={formData.coreExploration}
                    onChange={handleInputChange}
                    placeholder="Mengamati tanaman sawi..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Elaborasi / Diskusi:
                  </label>
                  <textarea
                    name="coreElaboration"
                    rows={2}
                    value={formData.coreElaboration}
                    onChange={handleInputChange}
                    placeholder="Diskusi kelompok menyelesaikan LKPD..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Praktik / Eksperimen:
                  </label>
                  <textarea
                    name="coreDiscussionOrPractice"
                    rows={2}
                    value={formData.coreDiscussionOrPractice}
                    onChange={handleInputChange}
                    placeholder="Menguji kapilaritas batang..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Penerapan & Presentasi:
                  </label>
                  <textarea
                    name="coreApplication"
                    rows={2}
                    value={formData.coreApplication}
                    onChange={handleInputChange}
                    placeholder="Presentasi kelompok di depan kelas..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Uraian Lengkap Kegiatan Inti <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="coreDescription"
                  rows={8}
                  value={formData.coreDescription}
                  onChange={handleInputChange}
                  placeholder="Fase 1: Orientasi Siswa pada Masalah
- Guru memperlihatkan tanaman yang layu dan tanaman yang segar.
- Siswa merespons penyebab tanaman layu.

Fase 2: Mengorganisasikan Siswa untuk Belajar
- Siswa dibagi menjadi 6 kelompok kerja.
- Guru membagikan LKPD struktur tumbuhan.

Fase 3: Membimbing Penyelidikan Mandiri & Kelompok
- Siswa mengamati penyerapan air berwarna merah pada tangkai sawi.
- Guru memfasilitasi tanya jawab dan observasi terbimbing.

Fase 4: Mengembangkan & Menyajikan Hasil Karya
- Kelompok menempelkan diagram bagian tumbuhan pada lembar kerja.
- Setiap kelompok mempresentasikan temuan utamanya.

Fase 5: Menganalisis & Mengevaluasi Proses Pemecahan Masalah
- Guru dan siswa membuat kesimpulan bersama."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Kegiatan Penutup */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                  3. Kegiatan Penutup
                </h4>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-zinc-400 font-medium">Alokasi Waktu:</label>
                  <input
                    type="text"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleInputChange}
                    className="px-2 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Refleksi:
                  </label>
                  <textarea
                    name="closingReflection"
                    rows={2}
                    value={formData.closingReflection}
                    onChange={handleInputChange}
                    placeholder="Siswa menyampaikan apa yang dipahami..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Kesimpulan:
                  </label>
                  <textarea
                    name="closingSummary"
                    rows={2}
                    value={formData.closingSummary}
                    onChange={handleInputChange}
                    placeholder="Merangkum fungsi akar, batang, daun..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Tindak Lanjut:
                  </label>
                  <textarea
                    name="closingFollowUp"
                    rows={2}
                    value={formData.closingFollowUp}
                    onChange={handleInputChange}
                    placeholder="Memberi pengantar materi pertemuan berikutnya..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Uraian Lengkap Kegiatan Penutup <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="closingDescription"
                  rows={4}
                  value={formData.closingDescription}
                  onChange={handleInputChange}
                  placeholder="1. Bersama-sama menarik kesimpulan tentang fungsi organ tumbuhan.
2. Guru membagikan lembar asesmen formatif mandiri (kuis 3 soal).
3. Guru mengajak siswa merefleksikan proses belajar hari ini.
4. Guru menginformasikan materi untuk pertemuan selanjutnya (fotosintesis).
5. Pembelajaran diakhiri dengan doa dan salam penutup."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Asesmen & KKTP */}
        {activeTab === "assessment" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              E. Asesmen, Instrumen & Kriteria Penilaian (KKTP)
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  1. Asesmen Diagnostik (Awal)
                </label>
                <textarea
                  name="diagnosticAssessment"
                  rows={3}
                  value={formData.diagnosticAssessment}
                  onChange={handleInputChange}
                  placeholder="Tanya jawab lisan untuk memetakan pemahaman awal siswa mengenai nama-nama bagian tumbuhan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  2. Asesmen Formatif (Proses) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="formativeAssessment"
                  rows={3}
                  value={formData.formativeAssessment}
                  onChange={handleInputChange}
                  placeholder="Lembar observasi keaktifan diskusi kelompok, unjuk kerja pengamatan tanaman, dan kuis singkat 3 butir soal."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  3. Asesmen Sumatif (Akhir Bab) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="summativeAssessment"
                  rows={3}
                  value={formData.summativeAssessment}
                  onChange={handleInputChange}
                  placeholder="Tes tertulis lingkup materi struktur dan fungsi tumbuhan (10 soal pilihan ganda, 5 soal isian singkat)."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Instrumen & Teknik Penilaian
                  </label>
                  <textarea
                    name="assessmentInstruments"
                    rows={4}
                    value={formData.assessmentInstruments}
                    onChange={handleInputChange}
                    placeholder="- Sikap: Lembar observasi profil pelajar pancasila (gotong royong, bernalar kritis).
- Pengetahuan: Tes tertulis pilihan ganda & uraian.
- Keterampilan: Rubrik unjuk kerja presentasi kelompok."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                  </label>
                  <textarea
                    name="assessmentCriteria"
                    rows={4}
                    value={formData.assessmentCriteria}
                    onChange={handleInputChange}
                    placeholder="Skala Interval Nilai:
- 0 - 65 : Perlu bimbingan intensif
- 66 - 75 : Cukup (mampu menyebutkan organ tumbuhan)
- 76 - 85 : Baik (mampu menjelaskan fungsi organ)
- 86 - 100 : Sangat Baik (mampu menganalisis kaitan organ & fotosintesis)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Diferensiasi & Tindak Lanjut */}
        {activeTab === "differentiation" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              F. Pembelajaran Berdiferensiasi, Remedial & Pengayaan
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Diferensiasi Konten
                  </label>
                  <textarea
                    name="contentDifferentiation"
                    rows={3}
                    value={formData.contentDifferentiation}
                    onChange={handleInputChange}
                    placeholder="Menyediakan gambar diagram warna untuk siswa visual dan spesimen tumbuhan segar untuk kinestetik..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Diferensiasi Proses
                  </label>
                  <textarea
                    name="processDifferentiation"
                    rows={3}
                    value={formData.processDifferentiation}
                    onChange={handleInputChange}
                    placeholder="Memberikan bimbingan terstruktur (scaffolding) bagi kelompok siswa yang belum terbiasa berdiskusi mandiri..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Diferensiasi Produk
                  </label>
                  <textarea
                    name="productDifferentiation"
                    rows={3}
                    value={formData.productDifferentiation}
                    onChange={handleInputChange}
                    placeholder="Siswa dapat menyajikan kesimpulan melalui poster gambar tumbuhan, tabel rangkuman, atau rekaman suara lisan..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Program Remedial <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="remedial"
                    rows={4}
                    value={formData.remedial}
                    onChange={handleInputChange}
                    placeholder="Bimbingan perorangan dengan mengulang demonstrasi tanaman seledri bertangkai merah untuk siswa yang belum mencapai KKTP."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Program Pengayaan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="enrichment"
                    rows={4}
                    value={formData.enrichment}
                    onChange={handleInputChange}
                    placeholder="Mengeksplorasi tanaman pemakan serangga (kantong semar) atau menjadi tutor sebaya bagi kelompok belajar."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Refleksi Guru & Siswa */}
        {activeTab === "reflection" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              G. Refleksi Pembelajaran
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Refleksi Pendidik (Guru) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="teacherReflection"
                  rows={5}
                  value={formData.teacherReflection}
                  onChange={handleInputChange}
                  placeholder="1. Apakah alokasi waktu eksperimen dan diskusi mencukupi?
2. Apakah seluruh peserta didik terlibat aktif dalam kelompok?
3. Apa kendala utama saat eksperimen air berwarna berlangsung?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Refleksi Peserta Didik <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="studentReflection"
                  rows={5}
                  value={formData.studentReflection}
                  onChange={handleInputChange}
                  placeholder="1. Bagian tumbuhan mana yang paling menarik dipelajari hari ini?
2. Apa hal yang paling menyenangkan saat melakukan percobaan?
3. Apakah kamu sudah bisa menceritakan fungsi daun kepada temanmu?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* 8. Lampiran & Referensi */}
        {activeTab === "attachments" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              H. Lampiran Dokumen RPP
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Ringkasan Lembar Kerja Peserta Didik (LKPD)
                </label>
                <textarea
                  name="worksheetOverview"
                  rows={4}
                  value={formData.worksheetOverview}
                  onChange={handleInputChange}
                  placeholder="Instruksi LKPD: Ambil satu batang tanaman seledri yang telah direndam air berwarna, amati menggunakan kaca pembesar, lalu catat perubahan pada daunnya..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Bahan Bacaan Guru & Peserta Didik
                </label>
                <textarea
                  name="readingMaterials"
                  rows={3}
                  value={formData.readingMaterials}
                  onChange={handleInputChange}
                  placeholder="Artikel ringkas tentang xylem dan floem serta fakta menarik mengenai pohon tertua di dunia..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Glosarium
                  </label>
                  <textarea
                    name="glossary"
                    rows={3}
                    value={formData.glossary}
                    onChange={handleInputChange}
                    placeholder="Fotosintesis: Proses pembuatan makanan oleh tumbuhan hijau dengan bantuan cahaya matahari.
Klorofil: Zat hijau daun yang berperan dalam fotosintesis."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Daftar Pustaka
                  </label>
                  <textarea
                    name="bibliography"
                    rows={3}
                    value={formData.bibliography}
                    onChange={handleInputChange}
                    placeholder="Amalia Fitri, dkk. (2021). Ilmu Pengetahuan Alam dan Sosial untuk SD Kelas IV. Jakarta: Pusat Kurikulum dan Perbukuan Kemdikbudristek."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. Riwayat Versi (Hanya Mode Edit) */}
        {activeTab === "versions" && isEdit && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              I. Riwayat Snapshot Versi RPP (Immutable)
            </h3>
            <p className="text-xs text-zinc-500">
              Setiap kali dokumen RPP disimpan atau diubah, sistem secara atomik mencatat snapshot versi yang tidak dapat diubah (immutable).
            </p>

            {versions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Belum ada riwayat versi.</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {versions.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-xs">
                          Versi v{v.versionNumber}
                        </span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                          Oleh {v.createdByName}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Disimpan pada {new Date(v.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <Link
                      href={`/guru/rpp/${formData.id}/preview?v=${v.versionNumber}`}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Lihat Snapshot v{v.versionNumber} →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Bar Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-400">
            Pastikan seluruh komponen bertanda (<span className="text-red-500">*</span>) telah terisi lengkap.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "DRAFT")}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-700 hover:bg-zinc-800 text-white transition disabled:opacity-50 cursor-pointer"
            >
              Simpan Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-md cursor-pointer"
            >
              {isSubmitting ? "Menyimpan Dokumen..." : isEdit ? "Perbarui & Simpan Versi Baru" : "Simpan Dokumen RPP"}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Deactivation */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Konfirmasi Nonaktifkan RPP
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan dokumen RPP <strong>{formData.title}</strong>? Dokumen ini akan diarsipkan (soft delete) dan tidak tampil pada daftar aktif.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
              >
                {isSubmitting ? "Menghapus..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
