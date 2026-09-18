import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { WorksheetEditor } from "../WorksheetEditor";

export default async function NewWorksheetPage() {
  const user = await requireRole("GURU");

  const [
    classroomsList,
    subjectsList,
    academicYearsList,
    semestersList,
  ] = await Promise.all([
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
  ]);

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Buat LKPD (Lembar Kerja Peserta Didik) Baru"
        subtitle="Susun lembar kerja praktikum, observasi, dan latihan soal interaktif untuk siswa SD"
      />

      <div className="max-w-5xl">
        <WorksheetEditor
          classrooms={classroomsList}
          subjects={subjectsList}
          academicYears={academicYearsList}
          semesters={semestersList}
          isEdit={false}
        />
      </div>
    </AppLayout>
  );
}
