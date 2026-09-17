import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getStudents } from "@/lib/data/students";
import { PageHeader } from "@/components/ui/Cards";
import { createStudentAction, softDeleteStudentAction } from "../actions";

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const search = params.q || "";
  const page = Number(params.page || 1);

  const { items, total, totalPages } = await getStudents({
    schoolId: user.schoolId,
    search,
    page,
    pageSize: 8,
  });

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Master Peserta Didik (Siswa)"
        subtitle={`Kelola biodata dan status ${total} peserta didik`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Siswa */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tambah Siswa Baru
          </h2>
          <form action={createStudentAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Lengkap Siswa <span className="text-red-500">*</span>
              </label>
              <input
                name="fullName"
                required
                placeholder="cth. Ahmad Fauzan"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  NIS
                </label>
                <input
                  name="nis"
                  placeholder="24001"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  NISN
                </label>
                <input
                  name="nisn"
                  placeholder="0123456789"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Jenis Kelamin
              </label>
              <select
                name="gender"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tempat Lahir
                </label>
                <input
                  name="birthPlace"
                  placeholder="Kota"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tanggal Lahir
                </label>
                <input
                  name="birthDate"
                  type="date"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Orang Tua / Wali
              </label>
              <input
                name="parentName"
                placeholder="Nama Ayah/Ibu/Wali"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nomor Telepon Orang Tua
              </label>
              <input
                name="parentPhone"
                placeholder="0812..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Simpan Data Siswa
            </button>
          </form>
        </div>

        {/* List Data */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Siswa Terdaftar
            </h2>
            <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari siswa..."
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

          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {search ? `Tidak ada siswa dengan kata kunci "${search}".` : "Belum ada data siswa."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">NIS / NISN</th>
                    <th className="py-2.5 px-3">JK</th>
                    <th className="py-2.5 px-3">Orang Tua</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {s.nis || "-"} / {s.nisn || "-"}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {s.gender === "MALE" ? "L" : s.gender === "FEMALE" ? "P" : "-"}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {s.parentName || "-"}
                        {s.parentPhone && <p className="text-[10px]">{s.parentPhone}</p>}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <form
                          action={softDeleteStudentAction.bind(null, s.id)}
                          className="inline-block"
                        >
                          <button
                            type="submit"
                            title="Hapus Siswa"
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-xs cursor-pointer"
                          >
                            Hapus
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>Halaman {page} dari {totalPages}</span>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={`/admin/siswa?page=${page - 1}&q=${search}`}
                        className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        Sebelumnya
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`/admin/siswa?page=${page + 1}&q=${search}`}
                        className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        Berikutnya
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
