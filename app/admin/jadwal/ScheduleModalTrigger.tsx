"use client";

import { useState } from "react";
import { ScheduleFormModal } from "./ScheduleClientComponents";

interface TriggerProps {
  academicYearsList: Array<{ id: string; name: string; isActive: boolean }>;
  semestersList: Array<{ id: string; name: string; number: number; academicYearId: string }>;
  teachersList: Array<{ id: string; fullName: string }>;
  classroomsList: Array<{ id: string; name: string; gradeLevel: number; academicYearName: string }>;
  subjectsList: Array<{ id: string; code: string; name: string }>;
}

export function ScheduleModalTrigger(props: TriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        ➕ Tambah Jadwal
      </button>

      <ScheduleFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        {...props}
      />
    </>
  );
}
