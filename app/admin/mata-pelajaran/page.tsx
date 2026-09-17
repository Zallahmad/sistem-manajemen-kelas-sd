import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { createSubjectAction } from "../actions";

export default async function MataPelajaranPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const search = params.q || "";

  const subjectsList = await getSubjects(user.schoolId, search);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Master Mata Pelajaran"
        subtitle="Kelola daftar mata pelajaran kurikulum sekolah dasar"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Mata Pelajaran */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tambah Mata Pelajaran
          </h2>
          <form action={createSubjectAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kode Mapel (cth. MAT, IPA, PAI) <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                required
                placeholder="MAT"
                className="w-full px-3 py-2 text-xs uppercase rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="Matematika"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Deskripsi / Keterangan
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Muatan pelajaran kurikulum..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Simpan Mata Pelajaran
            </button>
          </form>
        </div>

        {/* List Data */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Mata Pelajaran
            </h2>
            <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari mapel..."
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

          {subjectsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {search ? `Tidak ada mata pelajaran dengan kata kunci "${search}".` : "Belum ada mata pelajaran."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Mata Pelajaran</th>
                    <th className="py-2.5 px-3">Deskripsi</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {subjectsList.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {s.code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.name}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {s.description || "-"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                          }`}
                        >
                          {s.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
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
