import { db } from "@/db";
import {
  teachingModules,
  documentVersions,
  teachers,
  users,
  classrooms,
  subjects,
  academicYears,
  semesters,
} from "@/db/schema";
import { eq, and, isNull, desc, count, ilike, or } from "drizzle-orm";

// 1. Structured JSON content schema for Teaching Module
export interface TeachingModuleContent {
  identity: {
    schoolName: string;
    teacherName: string;
    classroomName: string;
    gradeLevel: number;
    phase: string; // e.g. "Fase A (Kelas 1-2)", "Fase B (Kelas 3-4)", "Fase C (Kelas 5-6)"
    semesterName: string;
    academicYearName: string;
    subjectName: string;
    subjectCode: string;
    topic: string;
    subTopic?: string;
    timeAllocation: string; // e.g. "2 x 35 Menit (1 Pertemuan)"
    targetStudents?: string; // e.g. "Peserta Didik Reguler / Tipikal (28 Siswa)"
    learningModel?: string; // e.g. "Problem-Based Learning (PBL) / Tatap Muka"
  };
  learningComponents: {
    initialCompetencies: string; // Kompetensi Awal
    pancasilaProfile: string[]; // Dimensi Profil Pelajar Pancasila
    learningObjectives: string; // Tujuan Pembelajaran
    meaningfulUnderstanding?: string; // Pemahaman Bermakna
    triggerQuestions?: string; // Pertanyaan Pemantik
    learningMaterials: string; // Materi Pokok Pembelajaran
    mediaAndTools: string; // Media, Alat, dan Bahan
    learningSources: string; // Sumber Belajar
  };
  activities: {
    openingActivities: string; // Kegiatan Pendahuluan
    coreActivities: string; // Kegiatan Inti
    closingActivities: string; // Kegiatan Penutup
    meetingNotes?: string;
  };
  assessments: {
    diagnosticAssessment?: string; // Asesmen Diagnostik
    formativeAssessment: string; // Asesmen Formatif
    summativeAssessment: string; // Asesmen Sumatif
    rubricAndCriteria?: string; // Kriteria & Rubrik Penilaian
  };
  differentiation: {
    contentDifferentiation?: string; // Diferensiasi Konten
    processDifferentiation?: string; // Diferensiasi Proses
    productDifferentiation?: string; // Diferensiasi Produk
  };
  followUp: {
    remedial: string; // Kegiatan Remedial
    enrichment: string; // Kegiatan Pengayaan
  };
  reflection: {
    teacherReflection: string; // Refleksi Pendidik
    studentReflection: string; // Refleksi Peserta Didik
  };
  attachments?: {
    studentWorksheetOverview?: string; // Ringkasan LKPD
    readingMaterials?: string; // Bahan Bacaan Guru & Peserta Didik
    glossary?: string; // Glosarium
    bibliography?: string; // Daftar Pustaka
  };
}

export type DocumentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Dalam Telaah",
  PUBLISHED: "Diterbitkan",
  ARCHIVED: "Diarsipkan",
};

export const DOCUMENT_STATUS_BADGE_CLASSES: Record<DocumentStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  ARCHIVED: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
};

// Helper to determine Kurikulum Merdeka Phase by SD grade level
export function getPhaseByGradeLevel(gradeLevel: number): string {
  if (gradeLevel <= 2) return "Fase A (Kelas 1 - 2 SD)";
  if (gradeLevel <= 4) return "Fase B (Kelas 3 - 4 SD)";
  return "Fase C (Kelas 5 - 6 SD)";
}

// 2. Filter for Teacher list
export interface GetTeacherTeachingModulesFilter {
  teacherUserId: string;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: DocumentStatus;
  search?: string;
}

export async function getTeacherTeachingModules({
  teacherUserId,
  classroomId,
  subjectId,
  academicYearId,
  semesterId,
  status,
  search,
}: GetTeacherTeachingModulesFilter) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  const conditions = [
    eq(teachingModules.teacherId, teacher.id),
    eq(teachingModules.schoolId, teacher.schoolId),
    isNull(teachingModules.deletedAt),
  ];

  if (classroomId) conditions.push(eq(teachingModules.classroomId, classroomId));
  if (subjectId) conditions.push(eq(teachingModules.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(teachingModules.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(teachingModules.semesterId, semesterId));
  if (status) conditions.push(eq(teachingModules.status, status));

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(teachingModules.title, term),
        ilike(teachingModules.topic, term),
        ilike(teachingModules.learningObjectives, term)
      )!
    );
  }

  const list = await db
    .select({
      id: teachingModules.id,
      title: teachingModules.title,
      topic: teachingModules.topic,
      learningObjectives: teachingModules.learningObjectives,
      status: teachingModules.status,
      classroomId: teachingModules.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: teachingModules.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: teachingModules.academicYearId,
      academicYearName: academicYears.name,
      semesterId: teachingModules.semesterId,
      semesterName: semesters.name,
      createdAt: teachingModules.createdAt,
      updatedAt: teachingModules.updatedAt,
    })
    .from(teachingModules)
    .innerJoin(classrooms, eq(teachingModules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(teachingModules.subjectId, subjects.id))
    .innerJoin(academicYears, eq(teachingModules.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(teachingModules.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(teachingModules.updatedAt));

  // Attach latest version number count
  return Promise.all(
    list.map(async (item) => {
      const versionCountRes = await db
        .select({ val: count() })
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentType, "TEACHING_MODULE"),
            eq(documentVersions.documentId, item.id)
          )
        );

      return {
        ...item,
        versionCount: Number(versionCountRes[0]?.val || 1),
      };
    })
  );
}

// 3. Get single teaching module by ID with full relations & authorization check
export async function getTeachingModuleById(moduleId: string, schoolId: string) {
  const result = await db
    .select({
      id: teachingModules.id,
      schoolId: teachingModules.schoolId,
      teacherId: teachingModules.teacherId,
      teacherName: teachers.fullName,
      teacherEmployeeNumber: teachers.employeeNumber,
      teacherUserId: teachers.userId,
      classroomId: teachingModules.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: teachingModules.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: teachingModules.academicYearId,
      academicYearName: academicYears.name,
      semesterId: teachingModules.semesterId,
      semesterName: semesters.name,
      title: teachingModules.title,
      topic: teachingModules.topic,
      learningObjectives: teachingModules.learningObjectives,
      content: teachingModules.content,
      activities: teachingModules.activities,
      assessment: teachingModules.assessment,
      status: teachingModules.status,
      createdAt: teachingModules.createdAt,
      updatedAt: teachingModules.updatedAt,
      deletedAt: teachingModules.deletedAt,
    })
    .from(teachingModules)
    .innerJoin(teachers, eq(teachingModules.teacherId, teachers.id))
    .innerJoin(classrooms, eq(teachingModules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(teachingModules.subjectId, subjects.id))
    .innerJoin(academicYears, eq(teachingModules.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(teachingModules.semesterId, semesters.id))
    .where(
      and(
        eq(teachingModules.id, moduleId),
        eq(teachingModules.schoolId, schoolId),
        isNull(teachingModules.deletedAt)
      )
    )
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0],
    content: result[0].content as TeachingModuleContent,
  };
}

// 4. Get Version History of a Teaching Module (Immutable snapshot history)
export async function getTeachingModuleVersions(moduleId: string) {
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
        eq(documentVersions.documentType, "TEACHING_MODULE"),
        eq(documentVersions.documentId, moduleId)
      )
    )
    .orderBy(desc(documentVersions.versionNumber));

  return versions.map((v) => ({
    ...v,
    content: v.content as TeachingModuleContent,
  }));
}

// 5. Admin Filter for School-wide Teaching Modules
export interface GetAdminTeachingModulesFilter {
  schoolId: string;
  teacherId?: string;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: DocumentStatus;
  search?: string;
}

export async function getAdminTeachingModules({
  schoolId,
  teacherId,
  classroomId,
  subjectId,
  academicYearId,
  semesterId,
  status,
  search,
}: GetAdminTeachingModulesFilter) {
  const conditions = [
    eq(teachingModules.schoolId, schoolId),
    isNull(teachingModules.deletedAt),
  ];

  if (teacherId) conditions.push(eq(teachingModules.teacherId, teacherId));
  if (classroomId) conditions.push(eq(teachingModules.classroomId, classroomId));
  if (subjectId) conditions.push(eq(teachingModules.subjectId, subjectId));
  if (academicYearId) conditions.push(eq(teachingModules.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(teachingModules.semesterId, semesterId));
  if (status) conditions.push(eq(teachingModules.status, status));

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(teachingModules.title, term),
        ilike(teachingModules.topic, term),
        ilike(teachers.fullName, term),
        ilike(subjects.name, term)
      )!
    );
  }

  return db
    .select({
      id: teachingModules.id,
      title: teachingModules.title,
      topic: teachingModules.topic,
      learningObjectives: teachingModules.learningObjectives,
      status: teachingModules.status,
      teacherId: teachingModules.teacherId,
      teacherName: teachers.fullName,
      classroomId: teachingModules.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: teachingModules.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearName: academicYears.name,
      semesterName: semesters.name,
      createdAt: teachingModules.createdAt,
      updatedAt: teachingModules.updatedAt,
    })
    .from(teachingModules)
    .innerJoin(teachers, eq(teachingModules.teacherId, teachers.id))
    .innerJoin(classrooms, eq(teachingModules.classroomId, classrooms.id))
    .innerJoin(subjects, eq(teachingModules.subjectId, subjects.id))
    .innerJoin(academicYears, eq(teachingModules.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(teachingModules.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(teachingModules.updatedAt));
}

// 6. Teacher Dashboard Stats
export async function getTeacherTeachingModuleStats(teacherUserId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) {
    return {
      totalModules: 0,
      draftCount: 0,
      publishedCount: 0,
      reviewCount: 0,
    };
  }

  const [totalRes, draftRes, publishedRes, reviewRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.teacherId, teacher.id),
          isNull(teachingModules.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.teacherId, teacher.id),
          eq(teachingModules.status, "DRAFT"),
          isNull(teachingModules.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.teacherId, teacher.id),
          eq(teachingModules.status, "PUBLISHED"),
          isNull(teachingModules.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.teacherId, teacher.id),
          eq(teachingModules.status, "REVIEW"),
          isNull(teachingModules.deletedAt)
        )
      ),
  ]);

  return {
    totalModules: Number(totalRes[0]?.val || 0),
    draftCount: Number(draftRes[0]?.val || 0),
    publishedCount: Number(publishedRes[0]?.val || 0),
    reviewCount: Number(reviewRes[0]?.val || 0),
  };
}

// 7. Admin Dashboard Stats
export async function getAdminTeachingModuleStats(schoolId: string) {
  const [totalRes, draftRes, publishedRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.schoolId, schoolId),
          isNull(teachingModules.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.schoolId, schoolId),
          eq(teachingModules.status, "DRAFT"),
          isNull(teachingModules.deletedAt)
        )
      ),
    db
      .select({ val: count() })
      .from(teachingModules)
      .where(
        and(
          eq(teachingModules.schoolId, schoolId),
          eq(teachingModules.status, "PUBLISHED"),
          isNull(teachingModules.deletedAt)
        )
      ),
  ]);

  return {
    totalModules: Number(totalRes[0]?.val || 0),
    draftCount: Number(draftRes[0]?.val || 0),
    publishedCount: Number(publishedRes[0]?.val || 0),
  };
}
