"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createTeachingModuleAction,
  updateTeachingModuleAction,
  publishTeachingModuleAction,
  deactivateTeachingModuleAction,
} from "./actions";
import {
  DocumentStatus,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DOCUMENT_STATUS_LABELS,
  getPhaseByGradeLevel,
} from "@/lib/data/teaching-modules";

export interface ClassroomOption {
  id: string;
  name: string;
  gradeLevel: number;
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export interface AcademicYearOption {
  id: string;
  name: string;
}

export interface SemesterOption {
  id: string;
  name: string;
  academicYearId: string;
}

export interface TeachingModuleFormData {
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
  initialCompetencies: string;
  pancasilaProfile: string[];
  learningObjectives: string;
  meaningfulUnderstanding: string;
  triggerQuestions: string;
  learningMaterials: string;
  mediaAndTools: string;
  learningSources: string;
  openingActivities: string;
  coreActivities: string;
  closingActivities: string;
  meetingNotes: string;
  diagnosticAssessment: string;
  formativeAssessment: string;
  summativeAssessment: string;
  rubricAndCriteria: string;
  contentDifferentiation: string;
  processDifferentiation: string;
  productDifferentiation: string;
  remedial: string;
  enrichment: string;
  teacherReflection: string;
  studentReflection: string;
  studentWorksheetOverview: string;
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

export function TeachingModuleEditor({
  initialData,
  classrooms,
  subjects,
  academicYears,
  semesters,
  isEdit = false,
  versions = [],
}: {
  initialData?: Partial<TeachingModuleFormData>;
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

  const [formData, setFormData] = useState<TeachingModuleFormData>({
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
    learningModel: initialData?.learningModel || "Problem-Based Learning (PBL) / Tatap Muka",
    initialCompetencies: initialData?.initialCompetencies || "",
    pancasilaProfile: initialData?.pancasilaProfile || [
      "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
      "Bernalar Kritis",
    ],
    learningObjectives: initialData?.learningObjectives || "",
    meaningfulUnderstanding: initialData?.meaningfulUnderstanding || "",
    triggerQuestions: initialData?.triggerQuestions || "",
    learningMaterials: initialData?.learningMaterials || "",
    mediaAndTools: initialData?.mediaAndTools || "",
    learningSources: initialData?.learningSources || "",
    openingActivities: initialData?.openingActivities || "",
    coreActivities: initialData?.coreActivities || "",
    closingActivities: initialData?.closingActivities || "",
    meetingNotes: initialData?.meetingNotes || "",
    diagnosticAssessment: initialData?.diagnosticAssessment || "",
    formativeAssessment: initialData?.formativeAssessment || "",
    summativeAssessment: initialData?.summativeAssessment || "",
    rubricAndCriteria: initialData?.rubricAndCriteria || "",
    contentDifferentiation: initialData?.contentDifferentiation || "",
    processDifferentiation: initialData?.processDifferentiation || "",
    productDifferentiation: initialData?.productDifferentiation || "",
    remedial: initialData?.remedial || "",
    enrichment: initialData?.enrichment || "",
    teacherReflection: initialData?.teacherReflection || "",
    studentReflection: initialData?.studentReflection || "",
    studentWorksheetOverview: initialData?.studentWorksheetOverview || "",
    readingMaterials: initialData?.readingMaterials || "",
    glossary: initialData?.glossary || "",
    bibliography: initialData?.bibliography || "",
  });

  const [activeTab, setActiveTab] = useState<
    | "identity"
    | "learning"
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

  // Filter semesters matching chosen academicYearId
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

    const submitPayload: TeachingModuleFormData = {
      ...formData,
      status: overrideStatus || formData.status,
    };

    try {
      if (isEdit && formData.id) {
        const res = await updateTeachingModuleAction(formData.id, submitPayload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal memperbarui Modul Ajar.");
        } else {
          setSuccessMessage(
            `Modul Ajar berhasil diperbarui! Versi v${res.versionNumber} telah dibuat.`
          );
          setFormData((prev) => ({ ...prev, status: submitPayload.status }));
          router.refresh();
        }
      } else {
        const res = await createTeachingModuleAction(submitPayload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal menyimpan Modul Ajar baru.");
        } else {
          router.push(`/guru/modul-ajar/${res.id}?saved=true`);
        }
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat menyimpan dokumen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const res = await publishTeachingModuleAction(formData.id);
      if (res.success) {
        setFormData((prev) => ({ ...prev, status: "PUBLISHED" }));
        setSuccessMessage("Modul Ajar berhasil dipublikasikan!");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Gagal mempublikasikan Modul Ajar.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mempublikasikan dokumen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const res = await deactivateTeachingModuleAction(formData.id);
      if (res.success) {
        setShowDeactivateModal(false);
        router.push("/guru/modul-ajar");
      } else {
        setErrorMessage(res.error || "Gagal menghapus Modul Ajar.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menonaktifkan dokumen.");
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
          <button
            onClick={() => setErrorMessage("")}
            className="font-bold ml-4 hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>✅ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="font-bold ml-4 hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Header & Navigation */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/guru/modul-ajar"
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition"
          >
            ← Kembali ke Daftar
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
            title="Integrasi pembuatan modul ajar terstruktur dengan Gemini AI akan aktif pada Task AI mendatang."
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition flex items-center gap-1.5 opacity-90 cursor-help"
          >
            <span>✨</span>
            <span>Generate dengan AI (Segera)</span>
          </button>

          {isEdit && formData.id && (
            <Link
              href={`/guru/modul-ajar/${formData.id}/preview`}
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
            {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui & Simpan Versi" : "Simpan Modul Ajar"}
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

      {/* Section Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto space-x-1 pb-1 text-xs font-semibold">
        {[
          { id: "identity" as const, label: "1. Identitas & Info Umum" },
          { id: "learning" as const, label: "2. Komponen Pembelajaran" },
          { id: "activities" as const, label: "3. Langkah Kegiatan" },
          { id: "assessment" as const, label: "4. Asesmen & Rubrik" },
          { id: "differentiation" as const, label: "5. Diferensiasi & Tindak Lanjut" },
          { id: "reflection" as const, label: "6. Refleksi Guru & Siswa" },
          { id: "attachments" as const, label: "7. Lampiran & Referensi" },
          ...(isEdit ? [{ id: "versions" as const, label: `8. Riwayat Versi (${versions.length})` }] : []),
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

      {/* Form Content Container */}
      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        {/* 1. Identitas */}
        {activeTab === "identity" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              A. Informasi Umum & Identitas Modul Ajar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Judul Modul Ajar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: Modul Ajar Matematika - Perkalian dan Pembagian Bilangan Cacah"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Topik / Materi Pokok <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="Contoh: Operasi Hitung Perkalian Bilangan Cacah"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Sub-Topik (Opsional)
                </label>
                <input
                  type="text"
                  name="subTopic"
                  value={formData.subTopic}
                  onChange={handleInputChange}
                  placeholder="Contoh: Perkalian Bersusun Puluhan dan Satuan"
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

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Model / Metode Pembelajaran
                </label>
                <input
                  type="text"
                  name="learningModel"
                  value={formData.learningModel}
                  onChange={handleInputChange}
                  placeholder="Contoh: Problem-Based Learning (PBL), Diskusi Kelompok, Eksplorasi Konsep, Penugasan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-2 pt-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Profil Pelajar Pancasila yang Dituju
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

        {/* 2. Komponen Pembelajaran */}
        {activeTab === "learning" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              B. Komponen Inti & Sasaran Pembelajaran
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
                  placeholder="Peserta didik telah mampu melakukan penjumlahan berulang dan memahami konsep dasar perkalian 1 sampai 10..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tujuan Pembelajaran (TP / CP) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="learningObjectives"
                  rows={4}
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  placeholder="1. Melalui eksplorasi benda konkret, peserta didik dapat menjelaskan konsep perkalian bersusun dengan tepat.
2. Melalui latihan terstruktur, peserta didik dapat menyelesaikan soal cerita perkalian..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

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
                    placeholder="Perkalian digunakan dalam kehidupan sehari-hari saat membeli barang dalam jumlah banyak, menghitung kelompok benda, dan berbagi rata..."
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
                    placeholder="Bagaimana cara tercepat menghitung jumlah seluruh donat jika ada 5 kotak dan masing-masing berisi 12 donat?"
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
                  placeholder="1. Konsep nilai tempat pada perkalian bilangan cacah.
2. Langkah-langkah perkalian cara bersusun pendek dan panjang.
3. Aplikasi perkalian pada pemecahan masalah kontekstual."
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
                    placeholder="Kartu angka, balok Dienes/kancing hitung, proyektor/slide pembelajaran, LKPD cetak..."
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
                    placeholder="Buku Siswa Matematika SD Kurikulum Merdeka Kemendikbudristek, video pembelajaran perkalian, lingkungan sekitar sekolah..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Langkah Kegiatan Pembelajaran */}
        {activeTab === "activities" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              C. Urutan Kegiatan Pembelajaran
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    1. Kegiatan Pendahuluan (± 10 - 15 Menit) <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  name="openingActivities"
                  rows={4}
                  value={formData.openingActivities}
                  onChange={handleInputChange}
                  placeholder="1. Guru membuka pembelajaran dengan salam, doa bersama, dan presensi.
2. Apersepsi: Guru mengulas materi sebelumnya dan menghubungkan dengan pertanyaan pemantik.
3. Guru menyampaikan tujuan pembelajaran dan alur kegiatan yang akan dilakukan."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    2. Kegiatan Inti (± 45 - 50 Menit) <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  name="coreActivities"
                  rows={8}
                  value={formData.coreActivities}
                  onChange={handleInputChange}
                  placeholder="Fase 1: Orientasi Siswa pada Masalah
- Guru menampilkan simulasi masalah kontekstual tentang pembelian perlengkapan kelas.
- Peserta didik mengamati dan menanggapi contoh permasalahan.

Fase 2: Mengorganisasikan Peserta Didik
- Siswa dibagi menjadi kelompok kecil beranggotakan 4-5 orang.
- Setiap kelompok menerima LKPD dan alat peraga hitung.

Fase 3: Membimbing Penyelidikan
- Guru mendampingi kelompok yang membutuhkan bimbingan bertahap.
- Siswa mempraktikkan langkah perkalian bersusun.

Fase 4: Mengembangkan dan Menyajikan Hasil
- Perwakilan kelompok mempresentasikan hasil pengerjaan di depan kelas.

Fase 5: Menganalisis dan Mengevaluasi
- Guru bersama siswa memberikan apresiasi dan meluruskan konsep."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    3. Kegiatan Penutup (± 10 - 15 Menit) <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  name="closingActivities"
                  rows={4}
                  value={formData.closingActivities}
                  onChange={handleInputChange}
                  placeholder="1. Siswa bersama guru menyimpulkan poin-poin utama materi yang telah dipelajari.
2. Siswa mengerjakan asesmen formatif mandiri (kuis singkat).
3. Guru memfasilitasi refleksi pembelajaran dan memberikan informasi rencana pertemuan selanjutnya.
4. Pembelajaran ditutup dengan doa dan salam."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Catatan Khusus Pertemuan (Opsional)
                </label>
                <input
                  type="text"
                  name="meetingNotes"
                  value={formData.meetingNotes}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pastikan alat peraga sudah disiapkan sebelum jam pelajaran dimulai."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Asesmen & Rubrik */}
        {activeTab === "assessment" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              D. Rancangan Asesmen Pembelajaran
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  1. Asesmen Diagnostik (Awal Pembelajaran)
                </label>
                <textarea
                  name="diagnosticAssessment"
                  rows={3}
                  value={formData.diagnosticAssessment}
                  onChange={handleInputChange}
                  placeholder="Tes lisan tanya-jawab mengenai perkalian dasar 1 digit saat kegiatan apersepsi..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  2. Asesmen Formatif (Selama Proses Pembelajaran) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="formativeAssessment"
                  rows={3}
                  value={formData.formativeAssessment}
                  onChange={handleInputChange}
                  placeholder="Observasi partisipasi diskusi kelompok, keaktifan menyelesaikan LKPD, dan kuis singkat 3 butir soal di akhir pertemuan."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  3. Asesmen Sumatif (Akhir Lingkup Materi) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="summativeAssessment"
                  rows={3}
                  value={formData.summativeAssessment}
                  onChange={handleInputChange}
                  placeholder="Tes tertulis berupa 5 soal pilihan ganda dan 3 soal uraian pemecahan masalah pada akhir bab."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Rubrik & Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                </label>
                <textarea
                  name="rubricAndCriteria"
                  rows={4}
                  value={formData.rubricAndCriteria}
                  onChange={handleInputChange}
                  placeholder="Kriteria:
- Perlu Bimbingan (0-60): Belum mampu mengalikan bilangan tanpa bantuan peraga.
- Cukup (61-75): Mampu menyelesaikan perkalian dasar namun masih keliru pada nilai tempat puluhan.
- Baik (76-88): Mampu menyelesaikan soal perkalian bersusun dengan tepat.
- Sangat Baik (89-100): Mampu menyelesaikan soal cerita pemecahan masalah dengan langkah terstruktur."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Diferensiasi & Tindak Lanjut */}
        {activeTab === "differentiation" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              E. Pembelajaran Berdiferensiasi & Tindak Lanjut
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
                    placeholder="Menyediakan gambar/video untuk pembelajar visual dan benda manipulatif untuk pembelajar kinestetik..."
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
                    placeholder="Memberikan pendampingan bertahap (scaffolding) bagi peserta didik yang masih membutuhkan bantuan..."
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
                    placeholder="Siswa dapat mempresentasikan hasil perhitungannya melalui gambar, tulisan cerita, atau penjelasan lisan..."
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
                    placeholder="Bimbingan perorangan atau kelompok kecil dengan bantuan peraga balok hitung bagi siswa yang belum mencapai KKTP."
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
                    placeholder="Pemberian tantangan soal cerita tingkat tinggi (HOTS) atau menjadi tutor sebaya bagi teman sekelompok."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Refleksi Guru & Siswa */}
        {activeTab === "reflection" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              F. Refleksi Pembelajaran
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
                  placeholder="1. Apakah semua peserta didik aktif dalam kegiatan diskusi?
2. Bagian materi mana yang paling sulit dipahami peserta didik?
3. Apa langkah perbaikan yang perlu diterapkan pada pertemuan berikutnya?"
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
                  placeholder="1. Apa hal baru yang kamu pelajari hari ini?
2. Bagian mana yang paling menyenangkan dari kegiatan tadi?
3. Apakah kamu sudah bisa menyelesaikan soal perkalian dengan mandiri?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. Lampiran & Referensi */}
        {activeTab === "attachments" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              G. Lampiran & Referensi Belajar
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Ringkasan / Lembar Kerja Peserta Didik (LKPD)
                </label>
                <textarea
                  name="studentWorksheetOverview"
                  rows={4}
                  value={formData.studentWorksheetOverview}
                  onChange={handleInputChange}
                  placeholder="Petunjuk Kerja LKPD: Siswa bersama kelompok menghitung perkalian bertingkat menggunakan kancing hitung..."
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
                  placeholder="Uraian ringkas materi perkalian bersusun dan tips menghafal perkalian mudah..."
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
                    placeholder="Perkalian: Penjumlahan berulang dari bilangan yang sama.
Bilangan Cacah: Himpunan bilangan bulat yang tidak negatif {0, 1, 2, 3, ...}."
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
                    placeholder="Hobri, dkk. (2022). Matematika untuk SD/MI Kelas IV. Jakarta: Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Riwayat Versi (Hanya Mode Edit) */}
        {activeTab === "versions" && isEdit && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              H. Riwayat Snapshot Versi Dokumen (Immutable)
            </h3>
            <p className="text-xs text-zinc-500">
              Setiap kali Modul Ajar disimpan atau diperbarui, sistem secara atomik mencatat snapshot versi dokumen yang tidak dapat diubah (immutable history).
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
                      href={`/guru/modul-ajar/${formData.id}/preview?v=${v.versionNumber}`}
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
            Pastikan seluruh komponen wajib (<span className="text-red-500">*</span>) telah terisi.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "DRAFT")}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-700 hover:bg-zinc-800 text-white transition disabled:opacity-50"
            >
              Simpan Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? "Menyimpan Dokumen..." : isEdit ? "Perbarui & Simpan Versi Baru" : "Simpan Modul Ajar"}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Deactivation */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Konfirmasi Nonaktifkan Modul Ajar
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan Modul Ajar <strong>{formData.title}</strong>? Dokumen ini akan diarsipkan (soft delete) dan tidak akan muncul di daftar aktif pembelajaran.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition"
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
