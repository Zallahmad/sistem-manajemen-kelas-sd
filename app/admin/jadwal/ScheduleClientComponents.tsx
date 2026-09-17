"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createScheduleAction, deactivateScheduleAction } from "./actions";

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYearsList: Array<{ id: string; name: string; isActive: boolean }>;
  semestersList: Array<{ id: string; name: string; number: number; academicYearId: string }>;
  teachersList: Array<{ id: string; fullName: string }>;
  classroomsList: Array<{ id: string; name: string; gradeLevel: number; academicYearName: string }>;
  subjectsList: Array<{ id: string; code: string; name: string }>;
}

export function ScheduleFormModal({
  isOpen,
  onClose,
  academicYearsList,
  semestersList,
  teachersList,
  classroomsList,
  subjectsList,
}: ScheduleFormModalProps) {
  const [selectedYearId, setSelectedYearId] = useState<string>(
    academicYearsList.find((y) => y.isActive)?.id || academicYearsList[0]?.id || ""
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const filteredSemesters = semestersList.filter(
    (s) => s.academicYearId === selectedYearId
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createScheduleAction(formData);

    setIsPending(false);

    if (!result.success) {
      setErrorMessage(result.error || "Gagal menyimpan jadwal.");
    } else {
      onClose();
      router.refresh();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Jadwal Pelajaran">
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              <option value="">-- Pilih Tahun Ajaran --</option>
              {academicYearsList.map((y) => (
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
              <option value="">-- Pilih Semester --</option>
              {filteredSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Semester {s.name} ({s.number})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Hari <span className="text-red-500">*</span>
            </label>
            <select
              name="dayOfWeek"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="MONDAY">Senin</option>
              <option value="TUESDAY">Selasa</option>
              <option value="WEDNESDAY">Rabu</option>
              <option value="THURSDAY">Kamis</option>
              <option value="FRIDAY">Jumat</option>
              <option value="SATURDAY">Sabtu</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Jam Mulai (HH:mm) <span className="text-red-500">*</span>
            </label>
            <input
              name="startTime"
              type="time"
              defaultValue="07:30"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Jam Selesai (HH:mm) <span className="text-red-500">*</span>
            </label>
            <input
              name="endTime"
              type="time"
              defaultValue="09:00"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Guru Pengampu <span className="text-red-500">*</span>
          </label>
          <select
            name="teacherId"
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">-- Pilih Guru --</option>
            {teachersList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Kelas <span className="text-red-500">*</span>
            </label>
            <select
              name="classroomId"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">-- Pilih Kelas --</option>
              {classroomsList.map((c) => (
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
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Ruangan (Opsional)
          </label>
          <input
            name="room"
            placeholder="cth. Ruang 101 / Laboratorium"
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
          >
            {isPending ? "Menyimpan & Memeriksa Bentrok..." : "Simpan Jadwal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeactivateScheduleButton({ scheduleId }: { scheduleId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleDeactivate = async () => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan jadwal ini?")) return;
    setIsPending(true);
    await deactivateScheduleAction(scheduleId);
    setIsPending(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDeactivate}
      disabled={isPending}
      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-xs cursor-pointer"
      title="Nonaktifkan Jadwal"
    >
      {isPending ? "..." : "Hapus"}
    </button>
  );
}
