import { requireRole, requireTeacherClassAccess } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getClassroomById, getClassroomStudents } from "@/lib/data/classrooms";
import { PageHeader } from "@/components/ui/Cards";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function GuruDetailKelasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("GURU");
  const { id: classroomId } = await params;

  // 1. Strict Server-side class authorization check
  const hasAccess = await requireTeacherClassAccess(user.id, classroomId);
  if (!hasAccess) {
    redirect("/guru/kelas");
  }

  // 2. Fetch classroom data
  const [classroom, studentsList] = await Promise.all([
    getClassroomById(classroomId, user.schoolId),
    getClassroomStudents(classroomId),
  ]);

  if (!classroom) {
    notFound();
  }

  return (
    <AppLayout user={user}>
      <div className="mb-4">
        <Link
          href="/guru/kelas"
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 inline-flex items-center gap-1"
        >
          ← Kembali ke Kelas Saya
        </Link>
      </div>

      <PageHeader
        title={`Rombongan Belajar: Kelas ${classroom.name}`}
        subtitle={`Tingkat ${classroom.gradeLevel} SD • Tahun Ajaran ${classroom.academicYearName} • Wali Kelas: ${classroom.homeroomTeacherName || "Belum ditentukan"}`}
      />

      <div className="space-y-6">
        {/* Siswa di kelas */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Siswa Terdaftar ({studentsList.length} Siswa)
            </h2>
          </div>

          {studentsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada siswa yang di-enroll ke kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Jenis Kelamin</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {studentsList.map((s, idx) => (
                    <tr key={s.enrollmentId}>
                      <td className="py-3 px-3 text-zinc-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">{s.nis || "-"}</td>
                      <td className="py-3 px-3 text-zinc-500">{s.nisn || "-"}</td>
                      <td className="py-3 px-3 text-zinc-500">
                        {s.gender === "MALE" ? "Laki-laki" : s.gender === "FEMALE" ? "Perempuan" : "-"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {s.status}
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
