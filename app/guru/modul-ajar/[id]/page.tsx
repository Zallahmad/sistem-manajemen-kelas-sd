import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getTeachingModuleById,
  getTeachingModuleVersions,
} from "@/lib/data/teaching-modules";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { TeachingModuleEditor } from "../TeachingModuleEditor";

export default async function EditTeachingModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("GURU");
  const { id } = await params;

  const [
    moduleData,
    versions,
    classroomsList,
    subjectsList,
    academicYearsList,
    semestersList,
  ] = await Promise.all([
    getTeachingModuleById(id, user.schoolId),
    getTeachingModuleVersions(id),
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
  ]);

  if (!moduleData || moduleData.teacherUserId !== user.id) {
    notFound();
  }

  const content = moduleData.content;

  const initialData = {
    id: moduleData.id,
    title: moduleData.title,
    topic: moduleData.topic,
    subTopic: content?.identity?.subTopic || "",
    classroomId: moduleData.classroomId,
    subjectId: moduleData.subjectId,
    academicYearId: moduleData.academicYearId,
    semesterId: moduleData.semesterId,
    status: moduleData.status,
    timeAllocation: content?.identity?.timeAllocation || "2 x 35 Menit",
    targetStudents: content?.identity?.targetStudents || "",
    learningModel: content?.identity?.learningModel || "",
    initialCompetencies: content?.learningComponents?.initialCompetencies || "",
    pancasilaProfile: content?.learningComponents?.pancasilaProfile || [],
    learningObjectives: moduleData.learningObjectives || content?.learningComponents?.learningObjectives || "",
    meaningfulUnderstanding: content?.learningComponents?.meaningfulUnderstanding || "",
    triggerQuestions: content?.learningComponents?.triggerQuestions || "",
    learningMaterials: content?.learningComponents?.learningMaterials || "",
    mediaAndTools: content?.learningComponents?.mediaAndTools || "",
    learningSources: content?.learningComponents?.learningSources || "",
    openingActivities: content?.activities?.openingActivities || "",
    coreActivities: content?.activities?.coreActivities || "",
    closingActivities: content?.activities?.closingActivities || "",
    meetingNotes: content?.activities?.meetingNotes || "",
    diagnosticAssessment: content?.assessments?.diagnosticAssessment || "",
    formativeAssessment: content?.assessments?.formativeAssessment || "",
    summativeAssessment: content?.assessments?.summativeAssessment || "",
    rubricAndCriteria: content?.assessments?.rubricAndCriteria || "",
    contentDifferentiation: content?.differentiation?.contentDifferentiation || "",
    processDifferentiation: content?.differentiation?.processDifferentiation || "",
    productDifferentiation: content?.differentiation?.productDifferentiation || "",
    remedial: content?.followUp?.remedial || "",
    enrichment: content?.followUp?.enrichment || "",
    teacherReflection: content?.reflection?.teacherReflection || "",
    studentReflection: content?.reflection?.studentReflection || "",
    studentWorksheetOverview: content?.attachments?.studentWorksheetOverview || "",
    readingMaterials: content?.attachments?.readingMaterials || "",
    glossary: content?.attachments?.glossary || "",
    bibliography: content?.attachments?.bibliography || "",
  };

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Edit Modul Ajar: ${moduleData.title}`}
        subtitle={`Rombel Kelas ${moduleData.classroomName} • ${moduleData.subjectName} • Diperbarui ${new Date(
          moduleData.updatedAt
        ).toLocaleDateString("id-ID")}`}
      />

      <div className="max-w-5xl">
        <TeachingModuleEditor
          initialData={initialData}
          classrooms={classroomsList}
          subjects={subjectsList}
          academicYears={academicYearsList}
          semesters={semestersList}
          isEdit={true}
          versions={versions}
        />
      </div>
    </AppLayout>
  );
}
