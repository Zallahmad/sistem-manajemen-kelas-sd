import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAcademicYears } from "@/lib/data/academic-years";
import { PageHeader } from "@/components/ui/Cards";
import { createAcademicYearAction, toggleAcademicYearActiveAction } from "../actions";

export default async function TahunAjaranPage() {
  const user = await requireRole("ADMIN");
  const years = await getAcademicYears(user.schoolId);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Master Tahun Ajaran"
        subtitle="Kelola kalender dan status keaktifan tahun ajaran sekolah"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tambah Tahun Ajaran
          </h2>
          <form action={createAcademicYearAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Tahun Ajaran (contoh: 2026/2027)
              </label>
              <input
                name="name"
                required
                placeholder="2026/2027"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tanggal Mulai
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tanggal Selesai
              </label>
              <input
                name="endDate"
                type="date"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" name="isActive" id="isActive" className="rounded" />
              <label htmlFor="isActive" className="text-xs text-zinc-600 dark:text-zinc-400">
                Jadikan tahun ajaran aktif sekarang
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Simpan Tahun Ajaran
            </button>
          </form>
        </div>

        {/* List Data */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Daftar Tahun Ajaran
          </h2>

          {years.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada data tahun ajaran. Silakan tambahkan pada formulir di samping.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Tahun Ajaran</th>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {years.map((y) => (
                    <tr key={y.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {y.name}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {new Date(y.startDate).toLocaleDateString("id-ID")} -{" "}
                        {new Date(y.endDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            y.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                          }`}
                        >
                          {y.isActive ? "AKTIF" : "TIDAK AKTIF"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!y.isActive && (
                          <form
                            action={toggleAcademicYearActiveAction.bind(null, y.id, true)}
                            className="inline-block"
                          >
                            <button
                              type="submit"
                              className="px-2.5 py-1 text-[11px] rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                            >
                              Aktifkan
                            </button>
                          </form>
                        )}
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
