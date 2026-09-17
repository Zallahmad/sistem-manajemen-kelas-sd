import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getAttendanceSessionData,
  getTodayDateJakarta,
} from "@/lib/data/attendance";
import { PageHeader } from "@/components/ui/Cards";
import { AttendanceForm } from "../AttendanceClientForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GuruDetailAbsensiPage({
  params,
  searchParams,
}: {
  params: Promise<{ scheduleId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireRole("GURU");
  const { scheduleId } = await params;
  const sParams = await searchParams;
  const dateStr = sParams.date || getTodayDateJakarta();

  const data = await getAttendanceSessionData(scheduleId, user.id, dateStr);

  if (!data) {
    notFound();
  }

  const { schedule, existingNotes, students } = data;

  return (
    <AppLayout user={user}>
      <div className="mb-3">
        <Link
          href="/guru/absensi"
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 inline-flex items-center gap-1"
        >
          ← Kembali ke Pilihan Jadwal
        </Link>
      </div>

      <PageHeader
        title={`Presensi: Kelas ${schedule.classroomName}`}
        subtitle={`${schedule.subjectName} • ${schedule.startTime} - ${schedule.endTime} • Tanggal: ${new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "full" })}`}
      />

      <AttendanceForm
        scheduleId={schedule.id}
        dateStr={dateStr}
        initialNotes={existingNotes}
        initialStudents={students}
      />
    </AppLayout>
  );
}
