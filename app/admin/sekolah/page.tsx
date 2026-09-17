import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getSchoolData } from "@/lib/data/schools";
import { PageHeader } from "@/components/ui/Cards";
import { updateSchoolAction } from "../actions";

export default async function SekolahPage() {
  const user = await requireRole("ADMIN");
  const school = await getSchoolData(user.schoolId);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Profil & Data Sekolah"
        subtitle="Kelola identitas dan informasi pokok sekolah dasar"
      />

      <div className="max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <form action={updateSchoolAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                defaultValue={school?.name || ""}
                required
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                NPSN
              </label>
              <input
                name="npsn"
                defaultValue={school?.npsn || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Telepon
              </label>
              <input
                name="phone"
                defaultValue={school?.phone || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Email Sekolah
              </label>
              <input
                name="email"
                type="email"
                defaultValue={school?.email || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Alamat Jalan
              </label>
              <input
                name="address"
                defaultValue={school?.address || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Desa / Kelurahan
              </label>
              <input
                name="village"
                defaultValue={school?.village || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kecamatan
              </label>
              <input
                name="district"
                defaultValue={school?.district || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kabupaten / Kota
              </label>
              <input
                name="regency"
                defaultValue={school?.regency || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Provinsi
              </label>
              <input
                name="province"
                defaultValue={school?.province || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kode Pos
              </label>
              <input
                name="postalCode"
                defaultValue={school?.postalCode || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
