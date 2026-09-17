import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTeacherAssignments } from "@/lib/data/assignments";
import { getAllActiveTeachersList } from "@/lib/data/teachers";
import { getClassrooms } from "@/lib/data/classrooms";
import { getAcademicYears } from "@/lib/data/academic-years";
import { PageHeader } from "@/components/ui/Cards";
import { assignTeacherToClassAction, removeTeacherAssignmentAction } from "../actions";

export default async function PenugasanGuruPage() {
  const user = await requireRole("ADMIN");

  const [assignments, teachersList, classroomsList, academicYearsList] = await Promise.all([
    getTeacherAssignments(user.schoolId),
    getAllActiveTeachersList(user.schoolId),
    getClassrooms(user.schoolId),
    getAcademicYears(user.schoolId),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Penugasan Guru ke Kelas (Class Assignments)"
        subtitle="Tentukan akses hak kelola kelas bagi tiap tenaga pendidik"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Penugasan */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Beri Penugasan Baru
          </h2>
          <form action={assignTeacherToClassAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Pilih Guru <span className="text-red-500">*</span>
              </label>
              <select
                name="teacherId"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">-- Pilih Guru --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Pilih Kelas <span className="text-red-500">*</span>
              </label>
              <select
                name="classroomId"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">-- Pilih Kelas --</option>
                {classroomsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} ({c.academicYearName})
                  </option>
                ))}
              </select>
            </div>

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

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
            >
              Tugaskan Guru ke Kelas
            </button>
          </form>
        </div>

        {/* List Penugasan */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Daftar Penugasan Aktif
          </h2>

          {assignments.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada penugasan guru ke kelas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">Guru</th>
                    <th className="py-2.5 px-3">Kelas & Tingkat</th>
                    <th className="py-2.5 px-3">Tahun Ajaran</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {a.teacherName}
                        <p className="text-[11px] font-normal text-zinc-500">{a.teacherEmail}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">
                          Kelas {a.classroomName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {a.academicYearName}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <form
                          action={removeTeacherAssignmentAction.bind(null, a.id)}
                          className="inline-block"
                        >
                          <button
                            type="submit"
                            title="Cabut Penugasan"
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-xs cursor-pointer"
                          >
                            Cabut
                          </button>
                        </form>
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
