import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { LessonPlanEditor } from "../LessonPlanEditor";

export default async function NewLessonPlanPage() {
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
        title="Buat Rencana Pelaksanaan Pembelajaran (RPP) Baru"
        subtitle="Susun skenario kegiatan pembelajaran tatap muka terstruktur lengkap dengan diferensiasi dan asesmen"
      />

      <div className="max-w-5xl">
        <LessonPlanEditor
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
