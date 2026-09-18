import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getLessonPlanById,
  getLessonPlanVersions,
} from "@/lib/data/lesson-plans";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { LessonPlanEditor } from "../LessonPlanEditor";

export default async function EditLessonPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("GURU");
  const { id } = await params;

  const [
    planData,
    versions,
    classroomsList,
    subjectsList,
    academicYearsList,
    semestersList,
  ] = await Promise.all([
    getLessonPlanById(id, user.schoolId),
    getLessonPlanVersions(id),
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
  ]);

  if (!planData || planData.teacherUserId !== user.id) {
    notFound();
  }

  const content = planData.content;

  const initialData = {
    id: planData.id,
    title: planData.title,
    topic: content?.identity?.topic || planData.title,
    subTopic: content?.identity?.subTopic || "",
    classroomId: planData.classroomId,
    subjectId: planData.subjectId,
    academicYearId: planData.academicYearId,
    semesterId: planData.semesterId,
    status: planData.status,
    timeAllocation: content?.identity?.timeAllocation || "2 x 35 Menit",
    targetStudents: content?.identity?.targetStudents || "",
    learningModel: content?.identity?.learningModel || "",
    learningMethod: content?.identity?.learningMethod || "",
    learningApproach: content?.identity?.learningApproach || "",
    initialCompetencies: content?.competencies?.initialCompetencies || "",
    learningAchievements: content?.competencies?.learningAchievements || "",
    learningObjectives: content?.competencies?.learningObjectives || "",
    pancasilaProfile: content?.competencies?.pancasilaProfile || [],
    meaningfulUnderstanding: content?.understandingAndTrigger?.meaningfulUnderstanding || "",
    triggerQuestions: content?.understandingAndTrigger?.triggerQuestions || "",
    learningMaterials: content?.mediaAndSources?.learningMaterials || "",
    mediaAndTools: content?.mediaAndSources?.mediaAndTools || "",
    learningSources: content?.mediaAndSources?.learningSources || "",
    openingOrientation: content?.activities?.opening?.orientation || "",
    openingApperception: content?.activities?.opening?.apperception || "",
    openingMotivation: content?.activities?.opening?.motivation || "",
    openingDescription: content?.activities?.opening?.description || "",
    openingTime: content?.activities?.opening?.timeAllocation || "10 Menit",
    coreExploration: content?.activities?.core?.exploration || "",
    coreElaboration: content?.activities?.core?.elaboration || "",
    coreDiscussionOrPractice: content?.activities?.core?.discussionOrPractice || "",
    coreApplication: content?.activities?.core?.application || "",
    coreDescription: content?.activities?.core?.description || "",
    coreTime: content?.activities?.core?.timeAllocation || "50 Menit",
    closingReflection: content?.activities?.closing?.reflection || "",
    closingSummary: content?.activities?.closing?.summary || "",
    closingFollowUp: content?.activities?.closing?.followUp || "",
    closingDescription: content?.activities?.closing?.description || "",
    closingTime: content?.activities?.closing?.timeAllocation || "10 Menit",
    meetingNotes: content?.activities?.meetingNotes || "",
    diagnosticAssessment: content?.assessments?.diagnosticAssessment || "",
    formativeAssessment: content?.assessments?.formativeAssessment || "",
    summativeAssessment: content?.assessments?.summativeAssessment || "",
    assessmentInstruments: content?.assessments?.assessmentInstruments || "",
    assessmentCriteria: content?.assessments?.assessmentCriteria || "",
    contentDifferentiation: content?.differentiation?.contentDifferentiation || "",
    processDifferentiation: content?.differentiation?.processDifferentiation || "",
    productDifferentiation: content?.differentiation?.productDifferentiation || "",
    remedial: content?.followUp?.remedial || "",
    enrichment: content?.followUp?.enrichment || "",
    teacherReflection: content?.reflection?.teacherReflection || "",
    studentReflection: content?.reflection?.studentReflection || "",
    worksheetOverview: content?.attachments?.worksheetOverview || "",
    readingMaterials: content?.attachments?.readingMaterials || "",
    glossary: content?.attachments?.glossary || "",
    bibliography: content?.attachments?.bibliography || "",
  };

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Edit RPP: ${planData.title}`}
        subtitle={`Rombel Kelas ${planData.classroomName} • ${planData.subjectName} • Diperbarui ${new Date(
          planData.updatedAt
        ).toLocaleDateString("id-ID")}`}
      />

      <div className="max-w-5xl">
        <LessonPlanEditor
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
