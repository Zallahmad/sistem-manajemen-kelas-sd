import { db } from "@/db";
import {
  worksheets,
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

// Types of Activity for SD
export type WorksheetActivityType =
  | "DISKUSI"
  | "OBSERVASI"
  | "EKSPERIMEN"
  | "PRAKTIK"
  | "MENCOCOKKAN"
  | "MENGELOMPOKKAN"
  | "MENGISI_TABEL"
  | "MENJAWAB_PERTANYAAN"
  | "PROYEK_SEDERHANA"
  | "PRESENTASI"
  | "REFLEKSI";

export const WORKSHEET_ACTIVITY_TYPE_LABELS: Record<WorksheetActivityType, string> = {
  DISKUSI: "Diskusi Kelompok",
  OBSERVASI: "Pengamatan / Observasi",
  EKSPERIMEN: "Eksperimen / Uji Coba",
  PRAKTIK: "Praktik Langsung",
  MENCOCOKKAN: "Menjodohkan / Mencocokkan",
  MENGELOMPOKKAN: "Mengelompokkan / Klasifikasi",
  MENGISI_TABEL: "Mengisi Tabel / Lembar Isian",
  MENJAWAB_PERTANYAAN: "Menjawab Pertanyaan",
  PROYEK_SEDERHANA: "Proyek Sederhana / Karya",
  PRESENTASI: "Presentasi Hasil",
  REFLEKSI: "Refleksi Siswa",
};

// Types of Questions
export type WorksheetQuestionType =
  | "MULTIPLE_CHOICE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "TRUE_FALSE"
  | "TABLE"
  | "OBSERVATION";

export const WORKSHEET_QUESTION_TYPE_LABELS: Record<WorksheetQuestionType, string> = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  SHORT_ANSWER: "Isian Singkat",
  ESSAY: "Uraian / Penjelasan",
  TRUE_FALSE: "Benar / Salah",
  TABLE: "Tabel Isian",
  OBSERVATION: "Lembar Observasi",
};

export interface WorksheetActivityItem {
  id: string;
  title: string;
  type: WorksheetActivityType;
  instruction: string;
  questions: string[];
  expectedOutput: string;
}

export interface WorksheetQuestionItem {
  id: string;
  type: WorksheetQuestionType;
  question: string;
  options: string[]; // For MULTIPLE_CHOICE or TRUE_FALSE
  answerKey: string;
  points: number;
}

// 1. Structured JSON content schema for Worksheet (LKPD)
export interface WorksheetContent {
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
    groupType?: string; // Individu / Kelompok (4-5 Orang)
  };
  instructionsAndObjectives: {
    worksheetTitle: string;
    generalInstructions: string;
    activityObjectives: string;
    prerequisites?: string;
    toolsAndMaterials: string;
    learningSources: string;
  };
  briefMaterial: {
    introductoryMaterial: string;
    keyConcepts: string;
    examplesOrIllustrations?: string;
    supportingInfo?: string;
  };
  activities: WorksheetActivityItem[];
  questions: WorksheetQuestionItem[];
  assessmentAndRubric: {
    assessmentCriteria: string;
    maxScore: number;
    simpleRubric: string;
    teacherNotes?: string;
  };
  reflection: {
    studentReflection: {
      learned: string;
      understoodMost: string;
      difficultParts: string;
      feeling: string;
    };
    teacherReflection: {
      activityAchievement: string;
      teacherNotes: string;
      followUp: string;
    };
  };
  attachments?: {
    readingMaterials?: string;
    glossary?: string;
    learningSources?: string;
    additionalNotes?: string;
  };
}

// 2. Filter for Teacher Worksheets List
export interface GetTeacherWorksheetsFilter {
  teacherUserId: string;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: DocumentStatus;
  search?: string;
}

export async function getTeacherWorksheets({
  teacherUserId,
  classroomId,
  subjectId,
  academicYearId,
  semesterId,
  status,
  search,
}: GetTeacherWorksheetsFilter) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  const conditions = [
    eq(worksheets.teacherId, teacher.id),
    eq(worksheets.schoolId, teacher.schoolId),
    isNull(worksheets.deletedAt),
  ];

  if (classroomId) conditions.push(eq(worksheets.classroomId, classroomId));
  if (subjectId) conditions.push(eq(worksheets.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(worksheets.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(worksheets.semesterId, semesterId));
  if (status) conditions.push(eq(worksheets.status, status));

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(ilike(worksheets.title, term));
  }

  const list = await db
    .select({
      id: worksheets.id,
      title: worksheets.title,
      status: worksheets.status,
      content: worksheets.content,
      classroomId: worksheets.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: worksheets.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: worksheets.academicYearId,
      academicYearName: academicYears.name,
      semesterId: worksheets.semesterId,
      semesterName: semesters.name,
      createdAt: worksheets.createdAt,
      updatedAt: worksheets.updatedAt,
    })
    .from(worksheets)
    .innerJoin(classrooms, eq(worksheets.classroomId, classrooms.id))
    .innerJoin(subjects, eq(worksheets.subjectId, subjects.id))
    .innerJoin(academicYears, eq(worksheets.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(worksheets.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(worksheets.updatedAt));

  return Promise.all(
    list.map(async (item) => {
      const versionCountRes = await db
        .select({ val: count() })
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentType, "WORKSHEET"),
            eq(documentVersions.documentId, item.id)
          )
        );

      const contentTyped = item.content as WorksheetContent;

      return {
        ...item,
        topic: contentTyped?.identity?.topic || item.title,
        activityCount: contentTyped?.activities?.length || 0,
        questionCount: contentTyped?.questions?.length || 0,
        versionCount: Number(versionCountRes[0]?.val || 1),
      };
    })
  );
}

// 3. Get single Worksheet by ID with full relations
export async function getWorksheetById(worksheetId: string, schoolId: string) {
  const result = await db
    .select({
      id: worksheets.id,
      schoolId: worksheets.schoolId,
      teacherId: worksheets.teacherId,
      teacherName: teachers.fullName,
      teacherEmployeeNumber: teachers.employeeNumber,
      teacherUserId: teachers.userId,
      classroomId: worksheets.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: worksheets.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: worksheets.academicYearId,
      academicYearName: academicYears.name,
      semesterId: worksheets.semesterId,
      semesterName: semesters.name,
      title: worksheets.title,
      content: worksheets.content,
      status: worksheets.status,
      createdAt: worksheets.createdAt,
      updatedAt: worksheets.updatedAt,
      deletedAt: worksheets.deletedAt,
    })
    .from(worksheets)
    .innerJoin(teachers, eq(worksheets.teacherId, teachers.id))
    .innerJoin(classrooms, eq(worksheets.classroomId, classrooms.id))
    .innerJoin(subjects, eq(worksheets.subjectId, subjects.id))
    .innerJoin(academicYears, eq(worksheets.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(worksheets.semesterId, semesters.id))
    .where(
      and(
        eq(worksheets.id, worksheetId),
        eq(worksheets.schoolId, schoolId),
        isNull(worksheets.deletedAt)
      )
    )
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0],
    content: result[0].content as WorksheetContent,
  };
}

// 4. Get Version History of a Worksheet
export async function getWorksheetVersions(worksheetId: string) {
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
        eq(documentVersions.documentType, "WORKSHEET"),
        eq(documentVersions.documentId, worksheetId)
      )
    )
    .orderBy(desc(documentVersions.versionNumber));

  return versions.map((v) => ({
    ...v,
    content: v.content as WorksheetContent,
  }));
}

// 5. Admin Filter for School-wide Worksheets
export interface GetAdminWorksheetsFilter {
  schoolId: string;
  teacherId?: string;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: DocumentStatus;
  search?: string;
}

export async function getAdminWorksheets({
  schoolId,
  teacherId,
  classroomId,
  subjectId,
  academicYearId,
  semesterId,
  status,
  search,
}: GetAdminWorksheetsFilter) {
  const conditions = [
    eq(worksheets.schoolId, schoolId),
    isNull(worksheets.deletedAt),
  ];

  if (teacherId) conditions.push(eq(worksheets.teacherId, teacherId));
  if (classroomId) conditions.push(eq(worksheets.classroomId, classroomId));
  if (subjectId) conditions.push(eq(worksheets.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(worksheets.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(worksheets.semesterId, semesterId));
  if (status) conditions.push(eq(worksheets.status, status));

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(worksheets.title, term),
        ilike(teachers.fullName, term),
        ilike(subjects.name, term)
      )!
    );
  }

  const list = await db
    .select({
      id: worksheets.id,
      title: worksheets.title,
      status: worksheets.status,
      content: worksheets.content,
      teacherId: worksheets.teacherId,
      teacherName: teachers.fullName,
      classroomId: worksheets.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: worksheets.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearName: academicYears.name,
      semesterName: semesters.name,
      createdAt: worksheets.createdAt,
      updatedAt: worksheets.updatedAt,
    })
    .from(worksheets)
    .innerJoin(teachers, eq(worksheets.teacherId, teachers.id))
    .innerJoin(classrooms, eq(worksheets.classroomId, classrooms.id))
    .innerJoin(subjects, eq(worksheets.subjectId, subjects.id))
    .innerJoin(academicYears, eq(worksheets.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(worksheets.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(worksheets.updatedAt));

  return list.map((item) => {
    const contentTyped = item.content as WorksheetContent;
    return {
      ...item,
      topic: contentTyped?.identity?.topic || item.title,
      activityCount: contentTyped?.activities?.length || 0,
      questionCount: contentTyped?.questions?.length || 0,
    };
  });
}

// 6. Teacher Dashboard Stats for Worksheet
export async function getTeacherWorksheetStats(teacherUserId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return {
      totalWorksheets: 0,
      draftCount: 0,
      publishedCount: 0,
      reviewCount: 0,
    };
  }

  const [totalRes, draftRes, publishedRes, reviewRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.teacherId, teacher.id),
          isNull(worksheets.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.teacherId, teacher.id),
          eq(worksheets.status, "DRAFT"),
          isNull(worksheets.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.teacherId, teacher.id),
          eq(worksheets.status, "PUBLISHED"),
          isNull(worksheets.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.teacherId, teacher.id),
          eq(worksheets.status, "REVIEW"),
          isNull(worksheets.deletedAt)
        )
      ),
  ]);

  return {
    totalWorksheets: Number(totalRes[0]?.val || 0),
    draftCount: Number(draftRes[0]?.val || 0),
    publishedCount: Number(publishedRes[0]?.val || 0),
    reviewCount: Number(reviewRes[0]?.val || 0),
  };
}

// 7. Admin Dashboard Stats for Worksheet
export async function getAdminWorksheetStats(schoolId: string) {
  const [totalRes, draftRes, publishedRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.schoolId, schoolId),
          isNull(worksheets.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.schoolId, schoolId),
          eq(worksheets.status, "DRAFT"),
          isNull(worksheets.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(worksheets)
      .where(
        and(
          eq(worksheets.schoolId, schoolId),
          eq(worksheets.status, "PUBLISHED"),
          isNull(worksheets.deletedAt)
        )
      ),
  ]);

  return {
    totalWorksheets: Number(totalRes[0]?.val || 0),
    draftCount: Number(draftRes[0]?.val || 0),
    publishedCount: Number(publishedRes[0]?.val || 0),
  };
}
