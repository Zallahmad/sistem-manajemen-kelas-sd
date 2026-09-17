import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getClassrooms } from "@/lib/data/classrooms";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getAllActiveTeachersList } from "@/lib/data/teachers";
import { PageHeader } from "@/components/ui/Cards";
import { createClassroomAction } from "../actions";

export default async function KelasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const search = params.q || "";

  const [classroomsList, academicYearsList, teachersList] = await Promise.all([
    getClassrooms(user.schoolId, search),
    getAcademicYears(user.schoolId),
    getAllActiveTeachersList(user.schoolId),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Master Rombongan Belajar (Kelas)"
        subtitle="Kelola kelas, tingkat, tahun ajaran, dan penunjukan wali kelas"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Kelas */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tambah Kelas Baru
          </h2>
          <form action={createClassroomAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <select
                name="academicYearId"
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tingkat (1 - 6) <span className="text-red-500">*</span>
                </label>
                <select
                  name="gradeLevel"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                  {[1, 2, 3, 4, 5, 6].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Kelas {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="cth. 1A, 5B"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Wali Kelas
              </label>
              <select
                name="homeroomTeacherId"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">-- Belum Ditentukan --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kapasitas Siswa
                </label>
                <input
                  name="capacity"
                  type="number"
                  defaultValue={30}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Ruangan
                </label>
                <input
                  name="roomName"
                  placeholder="R. 101"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Simpan Rombongan Belajar
            </button>
          </form>
        </div>

        {/* List Data */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Kelas Terdaftar
            </h2>
            <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari kelas..."
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-xs font-medium"
              >
                Cari
              </button>
            </form>
          </div>

          {classroomsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {search ? `Tidak ada kelas dengan kata kunci "${search}".` : "Belum ada data kelas."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Kelas / Tingkat</th>
                    <th className="py-2.5 px-3">Tahun Ajaran</th>
                    <th className="py-2.5 px-3">Wali Kelas</th>
                    <th className="py-2.5 px-3">Ruangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {classroomsList.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        Kelas {c.name}
                        <p className="text-[11px] font-normal text-zinc-500">
                          Tingkat {c.gradeLevel} (SD)
                        </p>
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 font-medium">
                        {c.academicYearName}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        {c.homeroomTeacherName || "-"}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {c.roomName || "-"} (Kapasitas: {c.capacity})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
