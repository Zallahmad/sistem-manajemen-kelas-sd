"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createAssessmentAction, deactivateAssessmentAction } from "./actions";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/data/grades";

interface Props {
  academicYearsList: Array<{ id: string; name: string; isActive: boolean }>;
  semestersList: Array<{ id: string; name: string; number: number; academicYearId: string }>;
  classroomsList: Array<{ id: string; name: string; gradeLevel: number; academicYearName: string }>;
  subjectsList: Array<{ id: string; code: string; name: string }>;
}

export function AssessmentModalTrigger(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string>(
    props.academicYearsList.find((y) => y.isActive)?.id || props.academicYearsList[0]?.id || ""
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const filteredSemesters = props.semestersList.filter(
    (s) => s.academicYearId === selectedYearId
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createAssessmentAction(formData);

    setIsPending(false);

    if (!result.success) {
      setErrorMessage(result.error || "Gagal membuat penilaian.");
    } else {
      setIsOpen(false);
      router.refresh();
      if (result.id) {
        router.push(`/guru/nilai/${result.id}`);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        ➕ Buat Komponen Penilaian
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tambah Komponen Penilaian">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Judul Penilaian <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="cth. Ulangan Harian 1: Pecahan Desimal"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Jenis Penilaian <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nilai Maksimal <span className="text-red-500">*</span>
              </label>
              <input
                name="maxScore"
                type="number"
                defaultValue={100}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <select
                name="academicYearId"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                {props.academicYearsList.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isActive ? "(Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semesterId"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                {filteredSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    Semester {s.name} ({s.number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Rombongan Belajar (Kelas) <span className="text-red-500">*</span>
              </label>
              <select
                name="classroomId"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">-- Pilih Kelas --</option>
                {props.classroomsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} ({c.academicYearName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                name="subjectId"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {props.subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tanggal Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <input
              name="assessmentDate"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Deskripsi / Materi Pokok (Opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Kompetensi dasar, materi capaian..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan & Lanjut Input Nilai"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeactivateAssessmentButton({ assessmentId }: { assessmentId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleDeactivate = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus komponen penilaian ini beserta seluruh nilainya?")) {
      return;
    }
    setIsPending(true);
    await deactivateAssessmentAction(assessmentId);
    setIsPending(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDeactivate}
      disabled={isPending}
      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-xs cursor-pointer"
      title="Hapus Penilaian"
    >
      {isPending ? "..." : "Hapus"}
    </button>
  );
}
