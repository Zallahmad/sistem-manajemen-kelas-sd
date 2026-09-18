import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getWorksheetById,
  getWorksheetVersions,
} from "@/lib/data/worksheets";
import { getAcademicYears } from "@/lib/data/academic-years";
import { getSemesters } from "@/lib/data/semesters";
import { getGuruAssignedClassrooms } from "@/lib/data/guru";
import { getSubjects } from "@/lib/data/subjects";
import { PageHeader } from "@/components/ui/Cards";
import { WorksheetEditor } from "../WorksheetEditor";

export default async function EditWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("GURU");
  const { id } = await params;

  const [
    worksheetData,
    versions,
    classroomsList,
    subjectsList,
    academicYearsList,
    semestersList,
  ] = await Promise.all([
    getWorksheetById(id, user.schoolId),
    getWorksheetVersions(id),
    getGuruAssignedClassrooms(user.id),
    getSubjects(user.schoolId),
    getAcademicYears(user.schoolId),
    getSemesters(user.schoolId),
  ]);

  if (!worksheetData || worksheetData.teacherUserId !== user.id) {
    notFound();
  }

  const content = worksheetData.content;

  const initialData = {
    id: worksheetData.id,
    title: worksheetData.title,
    topic: content?.identity?.topic || worksheetData.title,
    subTopic: content?.identity?.subTopic || "",
    classroomId: worksheetData.classroomId,
    subjectId: worksheetData.subjectId,
    academicYearId: worksheetData.academicYearId,
    semesterId: worksheetData.semesterId,
    status: worksheetData.status,
    timeAllocation: content?.identity?.timeAllocation || "1 x 35 Menit",
    targetStudents: content?.identity?.targetStudents || "",
    groupType: content?.identity?.groupType || "",
    worksheetTitle: content?.instructionsAndObjectives?.worksheetTitle || "",
    generalInstructions: content?.instructionsAndObjectives?.generalInstructions || "",
    activityObjectives: content?.instructionsAndObjectives?.activityObjectives || "",
    prerequisites: content?.instructionsAndObjectives?.prerequisites || "",
    toolsAndMaterials: content?.instructionsAndObjectives?.toolsAndMaterials || "",
    learningSources: content?.instructionsAndObjectives?.learningSources || "",
    introductoryMaterial: content?.briefMaterial?.introductoryMaterial || "",
    keyConcepts: content?.briefMaterial?.keyConcepts || "",
    examplesOrIllustrations: content?.briefMaterial?.examplesOrIllustrations || "",
    supportingInfo: content?.briefMaterial?.supportingInfo || "",
    activities: content?.activities || [],
    questions: content?.questions || [],
    assessmentCriteria: content?.assessmentAndRubric?.assessmentCriteria || "",
    maxScore: content?.assessmentAndRubric?.maxScore || 100,
    simpleRubric: content?.assessmentAndRubric?.simpleRubric || "",
    teacherNotes: content?.assessmentAndRubric?.teacherNotes || "",
    studentReflectLearned: content?.reflection?.studentReflection?.learned || "",
    studentReflectUnderstood: content?.reflection?.studentReflection?.understoodMost || "",
    studentReflectDifficult: content?.reflection?.studentReflection?.difficultParts || "",
    studentReflectFeeling: content?.reflection?.studentReflection?.feeling || "",
    teacherReflectAchievement: content?.reflection?.teacherReflection?.activityAchievement || "",
    teacherReflectNotes: content?.reflection?.teacherReflection?.teacherNotes || "",
    teacherReflectFollowUp: content?.reflection?.teacherReflection?.followUp || "",
    readingMaterials: content?.attachments?.readingMaterials || "",
    glossary: content?.attachments?.glossary || "",
    learningSourcesAttachment: content?.attachments?.learningSources || "",
    additionalNotes: content?.attachments?.additionalNotes || "",
  };

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Edit LKPD: ${worksheetData.title}`}
        subtitle={`Rombel Kelas ${worksheetData.classroomName} • ${worksheetData.subjectName} • Diperbarui ${new Date(
          worksheetData.updatedAt
        ).toLocaleDateString("id-ID")}`}
      />

      <div className="max-w-5xl">
        <WorksheetEditor
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
