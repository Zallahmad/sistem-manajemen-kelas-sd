import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getTeacherWeeklySchedules,
  DayOfWeek,
  DAY_NAMES_ID,
} from "@/lib/data/schedules";
import { PageHeader } from "@/components/ui/Cards";

export default async function GuruJadwalPage() {
  const user = await requireRole("GURU");
  const weeklySchedules = await getTeacherWeeklySchedules(user.id);

  const daysOrder: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const groupedByDay = daysOrder.reduce(
    (acc, day) => {
      acc[day] = weeklySchedules.filter((s) => s.dayOfWeek === day);
      return acc;
    },
    {} as Record<DayOfWeek, typeof weeklySchedules>
  );

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Jadwal Mengajar Saya"
        subtitle={`Agenda mengajar mingguan resmi untuk ${user.name}`}
      />

      {weeklySchedules.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Belum ada jadwal mengajar.
          </p>
          <p className="text-xs text-zinc-500">
            Administrator sekolah belum menetapkan jadwal mengajar mingguan untuk Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {daysOrder.map((day) => {
            const items = groupedByDay[day];
            const hasSchedules = items.length > 0;

            return (
              <div
                key={day}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {DAY_NAMES_ID[day]}
                  </h2>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {items.length} Sesi
                  </span>
                </div>

                {!hasSchedules ? (
                  <p className="text-xs text-zinc-400 py-4 text-center italic">
                    Tidak ada jadwal mengajar
                  </p>
                ) : (
                  <div className="space-y-2 flex-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.startTime} - {item.endTime}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                            Kelas {item.classroomName}
                          </span>
                        </div>

                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {item.subjectName}
                        </h3>

                        {item.room && (
                          <p className="text-[10px] text-zinc-400">
                            Ruang: {item.room}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
