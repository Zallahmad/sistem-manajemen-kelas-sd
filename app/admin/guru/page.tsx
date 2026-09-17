import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTeachers } from "@/lib/data/teachers";
import { PageHeader } from "@/components/ui/Cards";
import { createTeacherAction, toggleTeacherActiveAction } from "../actions";

export default async function GuruPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const search = params.q || "";
  const page = Number(params.page || 1);

  const { items, total, totalPages } = await getTeachers({
    schoolId: user.schoolId,
    search,
    page,
    pageSize: 8,
  });

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Master Tenaga Pendidik (Guru)"
        subtitle={`Kelola akun dan profil ${total} guru sekolah`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Guru */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tambah Guru Baru
          </h2>
          <form action={createTeacherAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                name="fullName"
                required
                placeholder="cth. Budi Santoso, S.Pd."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Alamat Email Login <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="budi@sekolah.sch.id"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kata Sandi Default <span className="text-red-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                NIP / NUPTK
              </label>
              <input
                name="employeeNumber"
                placeholder="1985..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nomor Telepon
              </label>
              <input
                name="phone"
                placeholder="0812..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Jabatan / Peran
              </label>
              <input
                name="position"
                placeholder="Guru Kelas / Guru Mapel"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Simpan & Buat Akun Guru
            </button>
          </form>
        </div>

        {/* List Data */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Guru Terdaftar
            </h2>
            <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari guru..."
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
              {search ? `Tidak ada guru dengan kata kunci "${search}".` : "Belum ada data guru."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Nama & NIP</th>
                    <th className="py-2.5 px-3">Email & Kontak</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map((g) => (
                    <tr key={g.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {g.fullName}
                        <p className="text-[11px] font-normal text-zinc-500">
                          {g.employeeNumber || "NIP: -"}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {g.email}
                        {g.phone && <p className="text-[11px]">{g.phone}</p>}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {g.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <form
                          action={toggleTeacherActiveAction.bind(null, g.userId, !g.isActive)}
                          className="inline-block"
                        >
                          <button
                            type="submit"
                            className="px-2.5 py-1 text-[11px] rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                          >
                            {g.isActive ? "Nonaktifkan" : "Aktifkan"}
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
                        href={`/admin/guru?page=${page - 1}&q=${search}`}
                        className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        Sebelumnya
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`/admin/guru?page=${page + 1}&q=${search}`}
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
