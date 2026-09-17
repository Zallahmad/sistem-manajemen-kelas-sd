import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";

export default async function GuruKelasPage() {
  const user = await requireRole("GURU");
  const classrooms = await getGuruAssignedClassrooms(user.id);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Kelas Saya"
        subtitle="Daftar rombongan belajar yang resmi ditugaskan kepada Anda"
      />

      {classrooms.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Belum ada rombongan belajar.
          </p>
          <p className="text-xs text-zinc-500">
            Anda belum memiliki penugasan kelas dari administrator sekolah.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                    Tingkat {c.gradeLevel} (SD)
                  </span>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                    Kelas {c.name}
                  </h2>
                </div>
                <span className="text-xs text-zinc-400">{c.academicYearName}</span>
              </div>

              <div className="text-xs text-zinc-500 space-y-1">
                <p>Ruang: <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.roomName || "-"}</span></p>
                <p>Kapasitas: <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.capacity} Siswa</span></p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:divide-zinc-800 flex justify-end">
                <Link
                  href={`/guru/kelas/${c.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
                >
                  Masuk Kelas →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
