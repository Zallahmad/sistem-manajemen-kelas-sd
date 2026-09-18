import { db } from "@/db";
import {
  lessonPlans,
  documentVersions,
  teachers,
  users,
  classrooms,
  subjects,
  academicYears,
  semesters,
} from "@/db/schema";
import { eq, and, isNull, desc, count, ilike, or } from "drizzle-orm";
import {
  DocumentStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  getPhaseByGradeLevel,
} from "@/lib/data/teaching-modules";

export {
  type DocumentStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_BADGE_CLASSES,
  getPhaseByGradeLevel,
};

// 1. Structured JSON content schema for Lesson Plan (RPP)
export interface LessonPlanContent {
  identity: {
    schoolName: string;
    teacherName: string;
    classroomName: string;
    gradeLevel: number;
    phase: string;
    semesterName: string;
    academicYearName: string;
    subjectName: string;
    subjectCode: string;
    topic: string;
    subTopic?: string;
    timeAllocation: string;
    targetStudents?: string;
    learningModel?: string;
    learningMethod?: string;
    learningApproach?: string;
  };
  competencies: {
    initialCompetencies: string;
    learningAchievements?: string; // Capaian Pembelajaran (CP)
    learningObjectives: string; // Tujuan Pembelajaran (TP)
    pancasilaProfile: string[];
  };
  understandingAndTrigger: {
    meaningfulUnderstanding?: string;
    triggerQuestions?: string;
  };
  mediaAndSources: {
    learningMaterials: string;
    mediaAndTools: string;
    learningSources: string;
  };
  activities: {
    opening: {
      orientation?: string;
      apperception?: string;
      motivation?: string;
      description: string;
      timeAllocation?: string;
    };
    core: {
      exploration?: string;
      elaboration?: string;
      discussionOrPractice?: string;
      application?: string;
      description: string;
      timeAllocation?: string;
    };
    closing: {
      reflection?: string;
      summary?: string;
      followUp?: string;
      description: string;
      timeAllocation?: string;
    };
    meetingNotes?: string;
  };
  assessments: {
    diagnosticAssessment?: string;
    formativeAssessment: string;
    summativeAssessment: string;
    assessmentInstruments?: string;
    assessmentCriteria?: string; // Rubrik & Kriteria KKTP
  };
  differentiation: {
    contentDifferentiation?: string;
    processDifferentiation?: string;
    productDifferentiation?: string;
  };
  followUp: {
    remedial: string;
    enrichment: string;
  };
  reflection: {
    teacherReflection: string;
    studentReflection: string;
  };
  attachments?: {
    worksheetOverview?: string;
    readingMaterials?: string;
    glossary?: string;
    bibliography?: string;
  };
}

// 2. Filter for Teacher Lesson Plans List
export interface GetTeacherLessonPlansFilter {
  teacherUserId: string;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: DocumentStatus;
  search?: string;
}

export async function getTeacherLessonPlans({
  teacherUserId,
  classroomId,
  subjectId,
  academicYearId,
  semesterId,
  status,
  search,
}: GetTeacherLessonPlansFilter) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  const conditions = [
    eq(lessonPlans.teacherId, teacher.id),
    eq(lessonPlans.schoolId, teacher.schoolId),
    isNull(lessonPlans.deletedAt),
  ];

  if (classroomId) conditions.push(eq(lessonPlans.classroomId, classroomId));
  if (subjectId) conditions.push(eq(lessonPlans.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(lessonPlans.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(lessonPlans.semesterId, semesterId));
  if (status) conditions.push(eq(lessonPlans.status, status));

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(ilike(lessonPlans.title, term));
  }

  const list = await db
    .select({
      id: lessonPlans.id,
      title: lessonPlans.title,
      status: lessonPlans.status,
      content: lessonPlans.content,
      classroomId: lessonPlans.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: lessonPlans.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: lessonPlans.academicYearId,
      academicYearName: academicYears.name,
      semesterId: lessonPlans.semesterId,
      semesterName: semesters.name,
      createdAt: lessonPlans.createdAt,
      updatedAt: lessonPlans.updatedAt,
    })
    .from(lessonPlans)
    .innerJoin(classrooms, eq(lessonPlans.classroomId, classrooms.id))
    .innerJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
    .innerJoin(academicYears, eq(lessonPlans.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(lessonPlans.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(lessonPlans.updatedAt));

  return Promise.all(
    list.map(async (item) => {
      const versionCountRes = await db
        .select({ val: count() })
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentType, "LESSON_PLAN"),
            eq(documentVersions.documentId, item.id)
          )
        );

      const contentTyped = item.content as LessonPlanContent;

      return {
        ...item,
        topic: contentTyped?.identity?.topic || item.title,
        versionCount: Number(versionCountRes[0]?.val || 1),
      };
    })
  );
}

// 3. Get single Lesson Plan by ID with full relations
export async function getLessonPlanById(lessonPlanId: string, schoolId: string) {
  const result = await db
    .select({
      id: lessonPlans.id,
      schoolId: lessonPlans.schoolId,
      teacherId: lessonPlans.teacherId,
      teacherName: teachers.fullName,
      teacherEmployeeNumber: teachers.employeeNumber,
      teacherUserId: teachers.userId,
      classroomId: lessonPlans.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: lessonPlans.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: lessonPlans.academicYearId,
      academicYearName: academicYears.name,
      semesterId: lessonPlans.semesterId,
      semesterName: semesters.name,
      title: lessonPlans.title,
      content: lessonPlans.content,
      status: lessonPlans.status,
      createdAt: lessonPlans.createdAt,
      updatedAt: lessonPlans.updatedAt,
      deletedAt: lessonPlans.deletedAt,
    })
    .from(lessonPlans)
    .innerJoin(teachers, eq(lessonPlans.teacherId, teachers.id))
    .innerJoin(classrooms, eq(lessonPlans.classroomId, classrooms.id))
    .innerJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
    .innerJoin(academicYears, eq(lessonPlans.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(lessonPlans.semesterId, semesters.id))
    .where(
      and(
        eq(lessonPlans.id, lessonPlanId),
        eq(lessonPlans.schoolId, schoolId),
        isNull(lessonPlans.deletedAt)
      )
    )
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0],
    content: result[0].content as LessonPlanContent,
  };
}

// 4. Get Version History of a Lesson Plan
export async function getLessonPlanVersions(lessonPlanId: string) {
  const versions = await db
    .select({
      id: documentVersions.id,
      documentId: documentVersions.documentId,
      versionNumber: documentVersions.versionNumber,
      content: documentVersions.content,
      createdBy: documentVersions.createdBy,
      createdByName: users.name,
      createdAt: documentVersions.createdAt,
    })
    .from(documentVersions)
    .innerJoin(users, eq(documentVersions.createdBy, users.id))
    .where(
      and(
        eq(documentVersions.documentType, "LESSON_PLAN"),
        eq(documentVersions.documentId, lessonPlanId)
      )
    )
    .orderBy(desc(documentVersions.versionNumber));

  return versions.map((v) => ({
    ...v,
    content: v.content as LessonPlanContent,
  }));
}

// 5. Admin Filter for School-wide Lesson Plans
export interface GetAdminLessonPlansFilter {
  schoolId: string;
  teacherId?: string;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: DocumentStatus;
  search?: string;
}

export async function getAdminLessonPlans({
  schoolId,
  teacherId,
  classroomId,
  subjectId,
  academicYearId,
  semesterId,
  status,
  search,
}: GetAdminLessonPlansFilter) {
  const conditions = [
    eq(lessonPlans.schoolId, schoolId),
    isNull(lessonPlans.deletedAt),
  ];

  if (teacherId) conditions.push(eq(lessonPlans.teacherId, teacherId));
  if (classroomId) conditions.push(eq(lessonPlans.classroomId, classroomId));
  if (subjectId) conditions.push(eq(lessonPlans.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(lessonPlans.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(lessonPlans.semesterId, semesterId));
  if (status) conditions.push(eq(lessonPlans.status, status));

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(lessonPlans.title, term),
        ilike(teachers.fullName, term),
        ilike(subjects.name, term)
      )!
    );
  }

  const list = await db
    .select({
      id: lessonPlans.id,
      title: lessonPlans.title,
      status: lessonPlans.status,
      content: lessonPlans.content,
      teacherId: lessonPlans.teacherId,
      teacherName: teachers.fullName,
      classroomId: lessonPlans.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: lessonPlans.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearName: academicYears.name,
      semesterName: semesters.name,
      createdAt: lessonPlans.createdAt,
      updatedAt: lessonPlans.updatedAt,
    })
    .from(lessonPlans)
    .innerJoin(teachers, eq(lessonPlans.teacherId, teachers.id))
    .innerJoin(classrooms, eq(lessonPlans.classroomId, classrooms.id))
    .innerJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
    .innerJoin(academicYears, eq(lessonPlans.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(lessonPlans.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(lessonPlans.updatedAt));

  return list.map((item) => {
    const contentTyped = item.content as LessonPlanContent;
    return {
      ...item,
      topic: contentTyped?.identity?.topic || item.title,
    };
  });
}

// 6. Teacher Dashboard Stats
export async function getTeacherLessonPlanStats(teacherUserId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return {
      totalPlans: 0,
      draftCount: 0,
      publishedCount: 0,
      reviewCount: 0,
    };
  }

  const [totalRes, draftRes, publishedRes, reviewRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.teacherId, teacher.id),
          isNull(lessonPlans.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.teacherId, teacher.id),
          eq(lessonPlans.status, "DRAFT"),
          isNull(lessonPlans.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.teacherId, teacher.id),
          eq(lessonPlans.status, "PUBLISHED"),
          isNull(lessonPlans.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.teacherId, teacher.id),
          eq(lessonPlans.status, "REVIEW"),
          isNull(lessonPlans.deletedAt)
        )
      ),
  ]);

  return {
    totalPlans: Number(totalRes[0]?.val || 0),
    draftCount: Number(draftRes[0]?.val || 0),
    publishedCount: Number(publishedRes[0]?.val || 0),
    reviewCount: Number(reviewRes[0]?.val || 0),
  };
}

// 7. Admin Dashboard Stats
export async function getAdminLessonPlanStats(schoolId: string) {
  const [totalRes, draftRes, publishedRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.schoolId, schoolId),
          isNull(lessonPlans.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.schoolId, schoolId),
          eq(lessonPlans.status, "DRAFT"),
          isNull(lessonPlans.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.schoolId, schoolId),
          eq(lessonPlans.status, "PUBLISHED"),
          isNull(lessonPlans.deletedAt)
        )
      ),
  ]);

  return {
    totalPlans: Number(totalRes[0]?.val || 0),
    draftCount: Number(draftRes[0]?.val || 0),
    publishedCount: Number(publishedRes[0]?.val || 0),
  };
}
