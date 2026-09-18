"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createWorksheetAction,
  updateWorksheetAction,
  publishWorksheetAction,
  deactivateWorksheetAction,
} from "./actions";
import {
  DocumentStatus,
  DOCUMENT_STATUS_BADGE_CLASSES,
  DOCUMENT_STATUS_LABELS,
  getPhaseByGradeLevel,
  WorksheetActivityItem,
  WorksheetQuestionItem,
  WorksheetActivityType,
  WorksheetQuestionType,
  WORKSHEET_ACTIVITY_TYPE_LABELS,
  WORKSHEET_QUESTION_TYPE_LABELS,
} from "@/lib/data/worksheets";
import {
  ClassroomOption,
  SubjectOption,
  AcademicYearOption,
  SemesterOption,
} from "../modul-ajar/TeachingModuleEditor";

export interface WorksheetFormData {
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
  groupType: string;
  worksheetTitle: string;
  generalInstructions: string;
  activityObjectives: string;
  prerequisites: string;
  toolsAndMaterials: string;
  learningSources: string;
  introductoryMaterial: string;
  keyConcepts: string;
  examplesOrIllustrations: string;
  supportingInfo: string;
  activities: WorksheetActivityItem[];
  questions: WorksheetQuestionItem[];
  assessmentCriteria: string;
  maxScore: number;
  simpleRubric: string;
  teacherNotes: string;
  studentReflectLearned: string;
  studentReflectUnderstood: string;
  studentReflectDifficult: string;
  studentReflectFeeling: string;
  teacherReflectAchievement: string;
  teacherReflectNotes: string;
  teacherReflectFollowUp: string;
  readingMaterials: string;
  glossary: string;
  learningSourcesAttachment: string;
  additionalNotes: string;
}

export function WorksheetEditor({
  initialData,
  classrooms,
  subjects,
  academicYears,
  semesters,
  isEdit = false,
  versions = [],
}: {
  initialData?: Partial<WorksheetFormData>;
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

  const [formData, setFormData] = useState<WorksheetFormData>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    topic: initialData?.topic || "",
    subTopic: initialData?.subTopic || "",
    classroomId: initialData?.classroomId || (classrooms[0]?.id || ""),
    subjectId: initialData?.subjectId || (subjects[0]?.id || ""),
    academicYearId: initialData?.academicYearId || (academicYears[0]?.id || ""),
    semesterId: initialData?.semesterId || (semesters[0]?.id || ""),
    status: (initialData?.status as DocumentStatus) || "DRAFT",
    timeAllocation: initialData?.timeAllocation || "1 x 35 Menit (Pengerjaan Kelompok)",
    targetStudents: initialData?.targetStudents || "Peserta Didik Reguler / Tipikal (28 Siswa)",
    groupType: initialData?.groupType || "Kelompok Kecil (4 - 5 Peserta Didik)",
    worksheetTitle: initialData?.worksheetTitle || "LEMBAR KERJA PESERTA DIDIK (LKPD)",
    generalInstructions: initialData?.generalInstructions || "1. Berdoalah sebelum mulai mengerjakan.\n2. Tuliskan identitas nama anggota kelompok.\n3. Bacalah materi pengantar dan langkah kegiatan dengan cermat.\n4. Kerjakan tugas secara bergotong royong.",
    activityObjectives: initialData?.activityObjectives || "",
    prerequisites: initialData?.prerequisites || "",
    toolsAndMaterials: initialData?.toolsAndMaterials || "",
    learningSources: initialData?.learningSources || "",
    introductoryMaterial: initialData?.introductoryMaterial || "",
    keyConcepts: initialData?.keyConcepts || "",
    examplesOrIllustrations: initialData?.examplesOrIllustrations || "",
    supportingInfo: initialData?.supportingInfo || "",
    activities: initialData?.activities || [
      {
        id: crypto.randomUUID(),
        title: "Aktivitas 1: Pengamatan Objek",
        type: "OBSERVASI",
        instruction: "Amatilah objek atau bahan yang telah disediakan di atas meja kelompok, lalu catat hasil pengamatanmu.",
        questions: ["Apa nama objek yang kalian amati?", "Sebutkan 3 ciri utama yang terlihat!"],
        expectedOutput: "Tabel catatan ciri-ciri fisik objek pengamatan.",
      },
    ],
    questions: initialData?.questions || [
      {
        id: crypto.randomUUID(),
        type: "SHORT_ANSWER",
        question: "Berdasarkan pengamatan di atas, jelaskan fungsi utama dari bagian yang kalian teliti!",
        options: [],
        answerKey: "",
        points: 20,
      },
    ],
    assessmentCriteria: initialData?.assessmentCriteria || "Ketepatan jawaban, kelengkapan data pengamatan, dan kekompakan kerja sama tim.",
    maxScore: initialData?.maxScore || 100,
    simpleRubric: initialData?.simpleRubric || "- Skor 86-100: Sangat Lengkap & Tepat\n- Skor 71-85: Lengkap & Tepat\n- Skor 60-70: Cukup Lengkap\n- Skor < 60: Perlu Bimbingan",
    teacherNotes: initialData?.teacherNotes || "",
    studentReflectLearned: initialData?.studentReflectLearned || "",
    studentReflectUnderstood: initialData?.studentReflectUnderstood || "",
    studentReflectDifficult: initialData?.studentReflectDifficult || "",
    studentReflectFeeling: initialData?.studentReflectFeeling || "",
    teacherReflectAchievement: initialData?.teacherReflectAchievement || "",
    teacherReflectNotes: initialData?.teacherReflectNotes || "",
    teacherReflectFollowUp: initialData?.teacherReflectFollowUp || "",
    readingMaterials: initialData?.readingMaterials || "",
    glossary: initialData?.glossary || "",
    learningSourcesAttachment: initialData?.learningSourcesAttachment || "",
    additionalNotes: initialData?.additionalNotes || "",
  });

  const [activeTab, setActiveTab] = useState<
    | "identity"
    | "instructions"
    | "material"
    | "activities"
    | "questions"
    | "assessment"
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

  // Activity management
  const addActivity = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          id: crypto.randomUUID(),
          title: `Aktivitas ${prev.activities.length + 1}`,
          type: "DISKUSI",
          instruction: "Tuliskan instruksi langkah kerja untuk peserta didik...",
          questions: [],
          expectedOutput: "",
        },
      ],
    }));
  };

  const removeActivity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== id),
    }));
  };

  const updateActivity = (id: string, field: keyof WorksheetActivityItem, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
  };

  // Question management
  const addQuestion = (type: WorksheetQuestionType = "SHORT_ANSWER") => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          type,
          question: "Tuliskan butir pertanyaan / tugas LKPD...",
          options: type === "MULTIPLE_CHOICE" ? ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"] : [],
          answerKey: "",
          points: 10,
        },
      ],
    }));
  };

  const removeQuestion = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const updateQuestion = (id: string, field: keyof WorksheetQuestionItem, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, overrideStatus?: DocumentStatus) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const submitPayload: WorksheetFormData = {
      ...formData,
      status: overrideStatus || formData.status,
    };

    try {
      if (isEdit && formData.id) {
        const res = await updateWorksheetAction(formData.id, submitPayload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal memperbarui LKPD.");
        } else {
          setSuccessMessage(`LKPD berhasil diperbarui! Versi v${res.versionNumber} telah dibuat.`);
          setFormData((prev) => ({ ...prev, status: submitPayload.status }));
          router.refresh();
        }
      } else {
        const res = await createWorksheetAction(submitPayload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal menyimpan LKPD baru.");
        } else {
          router.push(`/guru/lkpd/${res.id}?saved=true`);
        }
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat menyimpan dokumen LKPD.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const res = await publishWorksheetAction(formData.id);
      if (res.success) {
        setFormData((prev) => ({ ...prev, status: "PUBLISHED" }));
        setSuccessMessage("LKPD berhasil dipublikasikan!");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Gagal mempublikasikan LKPD.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mempublikasikan LKPD.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!formData.id) return;
    setIsSubmitting(true);
    try {
      const res = await deactivateWorksheetAction(formData.id);
      if (res.success) {
        setShowDeactivateModal(false);
        router.push("/guru/lkpd");
      } else {
        setErrorMessage(res.error || "Gagal menghapus LKPD.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menonaktifkan LKPD.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
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
            href="/guru/lkpd"
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition"
          >
            ← Kembali ke Daftar LKPD
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
            title="Integrasi pembuatan lembar kerja interaktif dengan Gemini AI akan aktif pada Task AI mendatang."
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition flex items-center gap-1.5 opacity-90 cursor-help"
          >
            <span>✨</span>
            <span>Generate dengan AI (Segera)</span>
          </button>

          {isEdit && formData.id && (
            <Link
              href={`/guru/lkpd/${formData.id}/preview`}
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
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              🚀 Terbitkan
            </button>
          )}

          <button
            type="button"
            onClick={(e) => handleSubmit(e, "DRAFT")}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-700 hover:bg-zinc-800 text-white transition disabled:opacity-50 cursor-pointer"
          >
            💾 Simpan Draft
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, formData.status)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui & Simpan Versi" : "Simpan Dokumen LKPD"}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeactivateModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto space-x-1 pb-1 text-xs font-semibold">
        {[
          { id: "identity" as const, label: "1. Identitas LKPD" },
          { id: "instructions" as const, label: "2. Petunjuk & Tujuan" },
          { id: "material" as const, label: "3. Materi Singkat" },
          { id: "activities" as const, label: `4. Aktivitas Siswa (${formData.activities.length})` },
          { id: "questions" as const, label: `5. Soal & Tugas (${formData.questions.length})` },
          { id: "assessment" as const, label: "6. Penilaian & Rubrik" },
          { id: "reflection" as const, label: "7. Refleksi" },
          { id: "attachments" as const, label: "8. Lampiran" },
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
        {/* 1. Identitas LKPD */}
        {activeTab === "identity" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              A. Identitas Lembar Kerja Peserta Didik
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Judul Dokumen LKPD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: LKPD IPAS Kelas 4 - Uji Kapilaritas Batang & Pengamatan Daun"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Topik / Materi Utama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="Contoh: Struktur & Fungsi Bagian Tumbuhan"
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
                  placeholder="Contoh: Eksperimen Penyerapan Air Berwarna"
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
                  Fase Kurikulum: <span className="font-bold text-blue-600">{calculatedPhase}</span>
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
                  Alokasi Waktu Pengerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="timeAllocation"
                  value={formData.timeAllocation}
                  onChange={handleInputChange}
                  placeholder="Contoh: 1 x 35 Menit (Pengerjaan Kelompok)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Bentuk Pengerjaan
                </label>
                <input
                  type="text"
                  name="groupType"
                  value={formData.groupType}
                  onChange={handleInputChange}
                  placeholder="Contoh: Kelompok Kecil (4 - 5 Orang) / Individu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Petunjuk & Tujuan */}
        {activeTab === "instructions" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              B. Petunjuk Umum & Sasaran Aktivitas
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Judul Kepala LKPD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="worksheetTitle"
                  value={formData.worksheetTitle}
                  onChange={handleInputChange}
                  placeholder="LEMBAR KERJA PESERTA DIDIK (LKPD) - PRAKTIK SAINS"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Petunjuk Pengerjaan untuk Siswa <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="generalInstructions"
                  rows={4}
                  value={formData.generalInstructions}
                  onChange={handleInputChange}
                  placeholder="1. Tuliskan nama anggota kelompok pada kolom yang tersedia.
2. Siapkan alat dan bahan percobaan.
3. Ikuti langkah kerja aktivitas secara berurutan.
4. Jawablah pertanyaan diskusi dengan berkolaborasi."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tujuan Aktivitas LKPD <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="activityObjectives"
                  rows={3}
                  value={formData.activityObjectives}
                  onChange={handleInputChange}
                  placeholder="1. Peserta didik dapat membuktikan adanya kapilaritas batang dalam mengangkut air.
2. Peserta didik dapat mengidentifikasi perubahan warna pada daun sawi."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Alat dan Bahan Percobaan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="toolsAndMaterials"
                    rows={3}
                    value={formData.toolsAndMaterials}
                    onChange={handleInputChange}
                    placeholder="Gelas plastik bening, pewarna makanan cair, batang sawi putih/seledri segar, air secukupnya, kaca pembesar (lup)."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Sumber Belajar / Rujukan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="learningSources"
                    rows={3}
                    value={formData.learningSources}
                    onChange={handleInputChange}
                    placeholder="Buku Siswa IPAS Kelas 4 Bab 1 Kemendikbudristek, video demonstrasi sains interaktif."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Materi Singkat */}
        {activeTab === "material" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              C. Rangkuman & Informasi Konsep Singkat
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Materi Pengantar / Konsep Awal <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="introductoryMaterial"
                  rows={4}
                  value={formData.introductoryMaterial}
                  onChange={handleInputChange}
                  placeholder="Tumbuhan membutuhkan air dan zat hara untuk hidup. Air diserap dari tanah oleh akar, lalu diangkut ke daun melalui pembuluh khusus di dalam batang yang disebut xilem."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Konsep Kunci Penting <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="keyConcepts"
                  rows={4}
                  value={formData.keyConcepts}
                  onChange={handleInputChange}
                  placeholder="1. Akar: menyerap air dan mineral dari tanah.
2. Batang: menyalurkan air ke seluruh bagian tanaman (daya kapilaritas).
3. Daun: tempat terjadinya fotosintesis untuk memasak makanan."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Contoh / Ilustrasi Kontekstual
                  </label>
                  <textarea
                    name="examplesOrIllustrations"
                    rows={3}
                    value={formData.examplesOrIllustrations}
                    onChange={handleInputChange}
                    placeholder="Sama seperti sedotan minuman, batang tumbuhan dapat menarik air ke atas melawan gravitasi bumi."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Informasi Pendukung / Tips Belajar
                  </label>
                  <textarea
                    name="supportingInfo"
                    rows={3}
                    value={formData.supportingInfo}
                    onChange={handleInputChange}
                    placeholder="Gunakan air pewarna dengan konsentrasi pekat agar jalur pembuluh pada batang lebih jelas terlihat."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Aktivitas Siswa */}
        {activeTab === "activities" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                D. Langkah-Langkah Aktivitas Peserta Didik
              </h3>
              <button
                type="button"
                onClick={addActivity}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <span>+</span>
                <span>Tambah Aktivitas</span>
              </button>
            </div>

            {formData.activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 border border-dashed rounded-xl">
                Belum ada aktivitas. Klik tombol &quot;+ Tambah Aktivitas&quot; di atas.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.activities.map((act, index) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                        Aktivitas #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeActivity(act.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        ✕ Hapus
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                          Judul Aktivitas
                        </label>
                        <input
                          type="text"
                          value={act.title}
                          onChange={(e) => updateActivity(act.id, "title", e.target.value)}
                          placeholder="Contoh: Eksperimen Penyerapan Air"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                          Bentuk Aktivitas
                        </label>
                        <select
                          value={act.type}
                          onChange={(e) => updateActivity(act.id, "type", e.target.value as WorksheetActivityType)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        >
                          {Object.entries(WORKSHEET_ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Instruksi Langkah Kerja <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={act.instruction}
                        onChange={(e) => updateActivity(act.id, "instruction", e.target.value)}
                        placeholder="1. Masukkan air berwarna ke dalam gelas bening.
2. Masukkan batang sawi dan diamkan selama 20 menit.
3. Amati perubahan warna pada tulang daun sawi."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Hasil / Format Output yang Diharapkan
                      </label>
                      <input
                        type="text"
                        value={act.expectedOutput || ""}
                        onChange={(e) => updateActivity(act.id, "expectedOutput", e.target.value)}
                        placeholder="Contoh: Tabel perbandingan warna sebelum dan sesudah 20 menit"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Soal & Tugas */}
        {activeTab === "questions" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                E. Lembar Pertanyaan, Soal & Tugas LKPD
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion("SHORT_ANSWER")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition"
                >
                  + Isian Singkat
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("MULTIPLE_CHOICE")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition"
                >
                  + Pilihan Ganda
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("ESSAY")}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition"
                >
                  + Soal Uraian
                </button>
              </div>
            </div>

            {formData.questions.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 border border-dashed rounded-xl">
                Belum ada butir pertanyaan. Tambahkan butir soal di atas.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                          Nomor {index + 1}.
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-semibold">
                          {WORKSHEET_QUESTION_TYPE_LABELS[q.type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase">Poin:</label>
                          <input
                            type="number"
                            value={q.points || 10}
                            onChange={(e) => updateQuestion(q.id, "points", Number(e.target.value))}
                            className="w-16 px-2 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Pertanyaan / Instruksi Soal <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                        placeholder="Tuliskan pertanyaan di sini..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        required
                      />
                    </div>

                    {q.type === "MULTIPLE_CHOICE" && (
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                          Pilihan Jawaban (A, B, C, D)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options && q.options.length > 0 ? q.options : ["", "", "", ""]).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-400">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || ["", "", "", ""])];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(q.id, "options", newOpts);
                                }}
                                placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Kunci Jawaban / Petunjuk Penilaian Guru (Opsional)
                      </label>
                      <input
                        type="text"
                        value={q.answerKey || ""}
                        onChange={(e) => updateQuestion(q.id, "answerKey", e.target.value)}
                        placeholder="Contoh: Air merambat naik melalui pembuluh xilem."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Penilaian & Rubrik */}
        {activeTab === "assessment" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              F. Kriteria Penilaian & Rubrik LKPD
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Kriteria Penilaian LKPD <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="assessmentCriteria"
                    rows={4}
                    value={formData.assessmentCriteria}
                    onChange={handleInputChange}
                    placeholder="1. Ketepatan pengamatan hasil percobaan.
2. Kejelasan analisis jawaban pada pertanyaan diskusi.
3. Kerapian dan ketertiban kerja kelompok."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Skor Maksimal Total
                  </label>
                  <input
                    type="number"
                    name="maxScore"
                    value={formData.maxScore}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-400">Default: 100 poin</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Rubrik Penilaian Sederhana <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="simpleRubric"
                  rows={4}
                  value={formData.simpleRubric}
                  onChange={handleInputChange}
                  placeholder="- Sangat Baik (86-100): Mengisi seluruh tabel pengamatan dengan akurat dan menjawab 100% soal dengan logis.
- Baik (71-85): Mengisi data pengamatan dan menjawab sebagian besar soal dengan tepat.
- Cukup (60-70): Data pengamatan belum lengkap namun berusaha menjawab soal.
- Perlu Bimbingan (<60): Belum mampu menyelesaikan tugas tanpa bantuan intensif."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Catatan Guru
                </label>
                <input
                  type="text"
                  name="teacherNotes"
                  value={formData.teacherNotes}
                  onChange={handleInputChange}
                  placeholder="Catatan tambahan untuk pelaksanaan di kelas..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. Refleksi */}
        {activeTab === "reflection" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              G. Refleksi Peserta Didik & Pendidik
            </h3>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                1. Format Refleksi Peserta Didik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Apa yang saya pelajari hari ini?
                  </label>
                  <input
                    type="text"
                    name="studentReflectLearned"
                    value={formData.studentReflectLearned}
                    onChange={handleInputChange}
                    placeholder="Contoh: Saya belajar cara air naik ke daun lewat batang."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Bagian mana yang paling saya pahami?
                  </label>
                  <input
                    type="text"
                    name="studentReflectUnderstood"
                    value={formData.studentReflectUnderstood}
                    onChange={handleInputChange}
                    placeholder="Contoh: Melihat warna merah merambat di tangkai sawi."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Apa yang masih terasa sulit?
                  </label>
                  <input
                    type="text"
                    name="studentReflectDifficult"
                    value={formData.studentReflectDifficult}
                    onChange={handleInputChange}
                    placeholder="Contoh: Menghafal istilah pembuluh xilem dan floem."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Bagaimana perasaanmu setelah belajar?
                  </label>
                  <input
                    type="text"
                    name="studentReflectFeeling"
                    value={formData.studentReflectFeeling}
                    onChange={handleInputChange}
                    placeholder="Contoh: Senang dan penasaran mencoba dengan tanaman lain."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pt-2">
                2. Refleksi Pendidik (Guru)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Ketercapaian Kegiatan
                  </label>
                  <textarea
                    rows={3}
                    name="teacherReflectAchievement"
                    value={formData.teacherReflectAchievement}
                    onChange={handleInputChange}
                    placeholder="85% kelompok berhasil menyelesaikan eksperimen dan mengisi LKPD tepat waktu..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Catatan Guru
                  </label>
                  <textarea
                    rows={3}
                    name="teacherReflectNotes"
                    value={formData.teacherReflectNotes}
                    onChange={handleInputChange}
                    placeholder="Beberapa siswa sempat menumpahkan air pewarna, perlu diingatkan kehati-hatian..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    Rencana Tindak Lanjut
                  </label>
                  <textarea
                    rows={3}
                    name="teacherReflectFollowUp"
                    value={formData.teacherReflectFollowUp}
                    onChange={handleInputChange}
                    placeholder="Melanjutkan dengan materi fotosintesis pada pertemuan luring berikutnya..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Lampiran */}
        {activeTab === "attachments" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              H. Lampiran & Catatan Tambahan LKPD
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Bahan Bacaan Siswa
                </label>
                <textarea
                  rows={3}
                  name="readingMaterials"
                  value={formData.readingMaterials}
                  onChange={handleInputChange}
                  placeholder="Fakta menarik tentang daya kapilaritas dan bagaimana pohon raksasa Sequoia dapat mengalirkan air hingga 100 meter ke pucuk pohon..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Glosarium
                  </label>
                  <textarea
                    rows={3}
                    name="glossary"
                    value={formData.glossary}
                    onChange={handleInputChange}
                    placeholder="Kapilaritas: Gejala merambatnya cairan melalui celah atau pembuluh sempit."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Catatan Tambahan
                  </label>
                  <textarea
                    rows={3}
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Lembar kerja ini dapat diperbanyak per kelompok atau dicetak rangkap untuk arsip portofolio siswa."
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
              I. Riwayat Snapshot Versi LKPD (Immutable)
            </h3>
            <p className="text-xs text-zinc-500">
              Setiap kali dokumen LKPD diperbarui, sistem secara atomik mencatat snapshot versi yang tidak dapat diubah (immutable).
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
                      href={`/guru/lkpd/${formData.id}/preview?v=${v.versionNumber}`}
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

        {/* Bottom Controls */}
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
              {isSubmitting ? "Menyimpan Dokumen..." : isEdit ? "Perbarui & Simpan Versi Baru" : "Simpan Dokumen LKPD"}
            </button>
          </div>
        </div>
      </form>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Konfirmasi Nonaktifkan LKPD
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan LKPD <strong>{formData.title}</strong>? Dokumen ini akan diarsipkan (soft delete) dan tidak tampil pada daftar aktif.
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
