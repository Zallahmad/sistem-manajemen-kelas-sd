import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getGuruStudents } from "@/lib/data/guru";
import { PageHeader } from "@/components/ui/Cards";

export default async function GuruSiswaPage() {
  const user = await requireRole("GURU");
  const studentsList = await getGuruStudents(user.id);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Siswa Saya"
        subtitle="Daftar peserta didik dari rombongan belajar yang Anda ampu"
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Total {studentsList.length} Peserta Didik
        </h2>

        {studentsList.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Belum ada siswa terdaftar pada kelas yang Anda ampu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Lengkap</th>
                  <th className="py-2.5 px-3">NIS / NISN</th>
                  <th className="py-2.5 px-3">Jenis Kelamin</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Tahun Ajaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {studentsList.map((s, idx) => (
                  <tr key={`${s.studentId}-${s.className}`}>
                    <td className="py-3 px-3 text-zinc-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.fullName}
                    </td>
                    <td className="py-3 px-3 text-zinc-500">
                      {s.nis || "-"} / {s.nisn || "-"}
                    </td>
                    <td className="py-3 px-3 text-zinc-500">
                      {s.gender === "MALE" ? "Laki-laki" : s.gender === "FEMALE" ? "Perempuan" : "-"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                        Kelas {s.className}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-500">{s.academicYearName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
