import { db } from "@/db";
import {
  assessments,
  grades,
  teachers,
  classrooms,
  subjects,
  academicYears,
  semesters,
  students,
  studentClassEnrollments,
} from "@/db/schema";
import { eq, and, isNull, desc, count, sql } from "drizzle-orm";

export type AssessmentType =
  | "DAILY"
  | "QUIZ"
  | "MIDTERM"
  | "FINAL"
  | "PROJECT"
  | "ASSIGNMENT"
  | "PRACTICAL";

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  DAILY: "Ulangan Harian",
  QUIZ: "Kuis",
  MIDTERM: "PTS (Tengah Semester)",
  FINAL: "PAS (Akhir Semester)",
  PROJECT: "Proyek",
  ASSIGNMENT: "Tugas",
  PRACTICAL: "Praktik",
};

// 1. Get teacher assessments with filter
export interface GetTeacherAssessmentsFilter {
  teacherUserId: string;
  academicYearId?: string;
  semesterId?: string;
  classroomId?: string;
  subjectId?: string;
  type?: AssessmentType;
}

export async function getTeacherAssessments({
  teacherUserId,
  academicYearId,
  semesterId,
  classroomId,
  subjectId,
  type,
}: GetTeacherAssessmentsFilter) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  const conditions = [
    eq(assessments.teacherId, teacher.id),
    eq(assessments.schoolId, teacher.schoolId),
    isNull(assessments.deletedAt),
  ];

  if (academicYearId) conditions.push(eq(assessments.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(assessments.semesterId, semesterId));
  if (classroomId) conditions.push(eq(assessments.classroomId, classroomId));
  if (subjectId) conditions.push(eq(assessments.subjectId, subjectId));
  if (type) conditions.push(eq(assessments.type, type));

  const list = await db
    .select({
      id: assessments.id,
      name: assessments.name,
      type: assessments.type,
      assessmentDate: assessments.assessmentDate,
      maxScore: assessments.maxScore,
      description: assessments.description,
      classroomId: assessments.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: assessments.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearName: academicYears.name,
      semesterName: semesters.name,
      createdAt: assessments.createdAt,
    })
    .from(assessments)
    .innerJoin(classrooms, eq(assessments.classroomId, classrooms.id))
    .innerJoin(subjects, eq(assessments.subjectId, subjects.id))
    .innerJoin(academicYears, eq(assessments.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(assessments.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(assessments.assessmentDate), desc(assessments.createdAt));

  // Compute how many grades have been entered vs total students
  return Promise.all(
    list.map(async (item) => {
      const [totalStudentsRes, gradedCountRes] = await Promise.all([
        db
          .select({ val: count() })
          .from(studentClassEnrollments)
          .where(
            and(
              eq(studentClassEnrollments.classroomId, item.classroomId),
              eq(studentClassEnrollments.status, "ACTIVE")
            )
          ),
        db
          .select({ val: count() })
          .from(grades)
          .where(eq(grades.assessmentId, item.id)),
      ]);

      const totalStudents = Number(totalStudentsRes[0]?.val || 0);
      const gradedCount = Number(gradedCountRes[0]?.val || 0);

      return {
        ...item,
        totalStudents,
        gradedCount,
        isCompleted: totalStudents > 0 && gradedCount >= totalStudents,
      };
    })
  );
}

// 2. Get assessment by ID (single)
export async function getAssessmentById(assessmentId: string, schoolId: string) {
  const result = await db
    .select({
      id: assessments.id,
      schoolId: assessments.schoolId,
      teacherId: assessments.teacherId,
      classroomId: assessments.classroomId,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectId: assessments.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      academicYearId: assessments.academicYearId,
      academicYearName: academicYears.name,
      semesterId: assessments.semesterId,
      semesterName: semesters.name,
      name: assessments.name,
      type: assessments.type,
      assessmentDate: assessments.assessmentDate,
      maxScore: assessments.maxScore,
      description: assessments.description,
      createdAt: assessments.createdAt,
      teacherName: teachers.fullName,
    })
    .from(assessments)
    .innerJoin(classrooms, eq(assessments.classroomId, classrooms.id))
    .innerJoin(subjects, eq(assessments.subjectId, subjects.id))
    .innerJoin(academicYears, eq(assessments.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(assessments.semesterId, semesters.id))
    .innerJoin(teachers, eq(assessments.teacherId, teachers.id))
    .where(
      and(
        eq(assessments.id, assessmentId),
        eq(assessments.schoolId, schoolId),
        isNull(assessments.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}

// 3. Get assessment and students for grade input page (/guru/nilai/[assessmentId])
export async function getAssessmentInputData(assessmentId: string, teacherUserId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return null;

  const assessment = await getAssessmentById(assessmentId, teacher.schoolId);
  if (!assessment || assessment.teacherId !== teacher.id) {
    return null;
  }

  // Active students in classroom
  const activeStudents = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      nis: students.nis,
      nisn: students.nisn,
      gender: students.gender,
    })
    .from(studentClassEnrollments)
    .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
    .where(
      and(
        eq(studentClassEnrollments.classroomId, assessment.classroomId),
        eq(studentClassEnrollments.status, "ACTIVE"),
        eq(students.schoolId, teacher.schoolId),
        isNull(students.deletedAt)
      )
    )
    .orderBy(students.fullName);

  // Existing grades
  const existingGrades = await db
    .select({
      studentId: grades.studentId,
      score: grades.score,
      notes: grades.notes,
    })
    .from(grades)
    .where(eq(grades.assessmentId, assessmentId));

  const gradeMap = new Map(
    existingGrades.map((g) => [g.studentId, { score: g.score, notes: g.notes }])
  );

  return {
    assessment,
    students: activeStudents.map((st) => {
      const g = gradeMap.get(st.studentId);
      return {
        ...st,
        score: g?.score ? String(parseFloat(g.score)) : "",
        notes: g?.notes || "",
        isGraded: !!g,
      };
    }),
  };
}

// 4. Get assessment summary / rekap (/guru/nilai/[assessmentId]/rekap)
export async function getAssessmentSummary(assessmentId: string, schoolId: string) {
  const assessment = await getAssessmentById(assessmentId, schoolId);
  if (!assessment) return null;

  const activeStudents = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      nis: students.nis,
      nisn: students.nisn,
      gender: students.gender,
    })
    .from(studentClassEnrollments)
    .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
    .where(
      and(
        eq(studentClassEnrollments.classroomId, assessment.classroomId),
        eq(studentClassEnrollments.status, "ACTIVE"),
        isNull(students.deletedAt)
      )
    )
    .orderBy(students.fullName);

  const existingGrades = await db
    .select({
      studentId: grades.studentId,
      score: grades.score,
      notes: grades.notes,
      updatedAt: grades.updatedAt,
    })
    .from(grades)
    .where(eq(grades.assessmentId, assessmentId));

  const gradeMap = new Map(
    existingGrades.map((g) => [g.studentId, { score: Number(g.score), notes: g.notes }])
  );

  const maxScore = Number(assessment.maxScore);

  const studentRows = activeStudents.map((st) => {
    const g = gradeMap.get(st.studentId);
    const scoreVal = g !== undefined ? g.score : null;
    const percentage =
      scoreVal !== null && maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;

    return {
      ...st,
      score: scoreVal,
      percentage,
      notes: g?.notes || null,
      isGraded: scoreVal !== null,
    };
  });

  const gradedOnly = studentRows.filter((s) => s.score !== null).map((s) => s.score as number);

  const totalStudents = activeStudents.length;
  const totalGraded = gradedOnly.length;
  const totalUngraded = totalStudents - totalGraded;

  const highestScore = gradedOnly.length > 0 ? Math.max(...gradedOnly) : 0;
  const lowestScore = gradedOnly.length > 0 ? Math.min(...gradedOnly) : 0;
  const averageScore =
    gradedOnly.length > 0
      ? Math.round((gradedOnly.reduce((a, b) => a + b, 0) / gradedOnly.length) * 10) / 10
      : 0;

  return {
    assessment,
    stats: {
      totalStudents,
      totalGraded,
      totalUngraded,
      highestScore,
      lowestScore,
      averageScore,
    },
    students: studentRows,
  };
}

// 5. Teacher Student Grade Summary (/guru/nilai/siswa)
export interface GetTeacherStudentGradeSummaryFilter {
  teacherUserId: string;
  classroomId?: string;
  subjectId?: string;
}

export async function getTeacherStudentGradeSummary({
  teacherUserId,
  classroomId,
  subjectId,
}: GetTeacherStudentGradeSummaryFilter) {
  const teacherRecord = await db
    .select({ id: teachers.id, schoolId: teachers.schoolId })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return [];

  // Find classrooms assigned to this teacher
  const conditions = [
    eq(studentClassEnrollments.status, "ACTIVE"),
    eq(students.schoolId, teacher.schoolId),
    isNull(students.deletedAt),
  ];

  if (classroomId) {
    conditions.push(eq(studentClassEnrollments.classroomId, classroomId));
  }

  const studentList = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      nis: students.nis,
      className: classrooms.name,
      classroomId: classrooms.id,
    })
    .from(studentClassEnrollments)
    .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
    .innerJoin(classrooms, eq(studentClassEnrollments.classroomId, classrooms.id))
    .where(and(...conditions))
    .orderBy(classrooms.name, students.fullName);

  return Promise.all(
    studentList.map(async (st) => {
      const assessmentConditions = [
        eq(assessments.teacherId, teacher.id),
        eq(assessments.classroomId, st.classroomId),
        isNull(assessments.deletedAt),
      ];

      if (subjectId) {
        assessmentConditions.push(eq(assessments.subjectId, subjectId));
      }

      const studentGrades = await db
        .select({
          score: grades.score,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .where(and(eq(grades.studentId, st.studentId), ...assessmentConditions));

      const scores = studentGrades.map((g) => Number(g.score));
      const totalAssessments = scores.length;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;
      const average =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : 0;

      return {
        ...st,
        totalAssessments,
        highestScore: highest,
        lowestScore: lowest,
        averageScore: average,
      };
    })
  );
}

// 6. Admin Grade Summary & Overview (/admin/nilai)
export interface GetAdminAssessmentsFilter {
  schoolId: string;
  academicYearId?: string;
  semesterId?: string;
  classroomId?: string;
  teacherId?: string;
  subjectId?: string;
  type?: AssessmentType;
}

export async function getAdminAssessments({
  schoolId,
  academicYearId,
  semesterId,
  classroomId,
  teacherId,
  subjectId,
  type,
}: GetAdminAssessmentsFilter) {
  const conditions = [
    eq(assessments.schoolId, schoolId),
    isNull(assessments.deletedAt),
  ];

  if (academicYearId) conditions.push(eq(assessments.academicYearId, academicYearId));
  if (semesterId) conditions.push(eq(assessments.semesterId, semesterId));
  if (classroomId) conditions.push(eq(assessments.classroomId, classroomId));
  if (teacherId) conditions.push(eq(assessments.teacherId, teacherId));
  if (subjectId) conditions.push(eq(assessments.subjectId, subjectId));
  if (type) conditions.push(eq(assessments.type, type));

  const list = await db
    .select({
      id: assessments.id,
      name: assessments.name,
      type: assessments.type,
      assessmentDate: assessments.assessmentDate,
      maxScore: assessments.maxScore,
      classroomName: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      teacherName: teachers.fullName,
      academicYearName: academicYears.name,
      semesterName: semesters.name,
      createdAt: assessments.createdAt,
    })
    .from(assessments)
    .innerJoin(classrooms, eq(assessments.classroomId, classrooms.id))
    .innerJoin(subjects, eq(assessments.subjectId, subjects.id))
    .innerJoin(teachers, eq(assessments.teacherId, teachers.id))
    .innerJoin(academicYears, eq(assessments.academicYearId, academicYears.id))
    .innerJoin(semesters, eq(assessments.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(assessments.assessmentDate))
    .limit(50);

  return Promise.all(
    list.map(async (item) => {
      const agg = await db
        .select({
          total: count(),
          avgScore: sql<string>`AVG(${grades.score})`,
        })
        .from(grades)
        .where(eq(grades.assessmentId, item.id));

      return {
        ...item,
        totalGraded: Number(agg[0]?.total || 0),
        avgScore: agg[0]?.avgScore ? Math.round(Number(agg[0].avgScore) * 10) / 10 : 0,
      };
    })
  );
}

// 7. Admin Classroom Grade Recap (tab rekap kelas)
export async function getAdminClassroomGradeRecap(schoolId: string) {
  const classroomsList = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      gradeLevel: classrooms.gradeLevel,
      academicYearName: academicYears.name,
    })
    .from(classrooms)
    .innerJoin(academicYears, eq(classrooms.academicYearId, academicYears.id))
    .where(and(eq(classrooms.schoolId, schoolId), isNull(classrooms.deletedAt)))
    .orderBy(classrooms.gradeLevel, classrooms.name);

  return Promise.all(
    classroomsList.map(async (c) => {
      const agg = await db
        .select({
          totalAssessments: count(assessments.id),
          totalGrades: count(grades.id),
          avgScore: sql<string>`AVG(${grades.score})`,
        })
        .from(assessments)
        .leftJoin(grades, eq(assessments.id, grades.assessmentId))
        .where(
          and(
            eq(assessments.classroomId, c.id),
            eq(assessments.schoolId, schoolId),
            isNull(assessments.deletedAt)
          )
        );

      return {
        ...c,
        totalAssessments: Number(agg[0]?.totalAssessments || 0),
        totalGrades: Number(agg[0]?.totalGrades || 0),
        avgScore: agg[0]?.avgScore ? Math.round(Number(agg[0].avgScore) * 10) / 10 : 0,
      };
    })
  );
}

// 8. Admin Student Grade Recap (tab rekap siswa)
export async function getAdminStudentGradeRecap(schoolId: string, classroomId?: string) {
  const conditions = [
    eq(students.schoolId, schoolId),
    isNull(students.deletedAt),
  ];

  if (classroomId) {
    conditions.push(eq(studentClassEnrollments.classroomId, classroomId));
    conditions.push(eq(studentClassEnrollments.status, "ACTIVE"));
  }

  const studentList = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      nis: students.nis,
      className: classrooms.name,
    })
    .from(students)
    .leftJoin(studentClassEnrollments, eq(students.id, studentClassEnrollments.studentId))
    .leftJoin(classrooms, eq(studentClassEnrollments.classroomId, classrooms.id))
    .where(and(...conditions))
    .orderBy(students.fullName)
    .limit(100);

  return Promise.all(
    studentList.map(async (st) => {
      const agg = await db
        .select({
          total: count(),
          avgScore: sql<string>`AVG(${grades.score})`,
          maxScore: sql<string>`MAX(${grades.score})`,
          minScore: sql<string>`MIN(${grades.score})`,
        })
        .from(grades)
        .where(eq(grades.studentId, st.id));

      return {
        ...st,
        totalGrades: Number(agg[0]?.total || 0),
        avgScore: agg[0]?.avgScore ? Math.round(Number(agg[0].avgScore) * 10) / 10 : 0,
        maxScore: agg[0]?.maxScore ? Number(agg[0].maxScore) : 0,
        minScore: agg[0]?.minScore ? Number(agg[0].minScore) : 0,
      };
    })
  );
}

// 9. Teacher Dashboard summary stats
export async function getTeacherGradeStats(teacherUserId: string) {
  const teacherRecord = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, teacherUserId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = teacherRecord[0];
  if (!teacher) return { activeAssessments: 0, totalGradesRecorded: 0 };

  const [assessmentsRes, gradesRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(assessments)
      .where(and(eq(assessments.teacherId, teacher.id), isNull(assessments.deletedAt))),
    db
      .select({ val: count() })
      .from(grades)
      .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
      .where(and(eq(assessments.teacherId, teacher.id), isNull(assessments.deletedAt))),
  ]);

  return {
    activeAssessments: Number(assessmentsRes[0]?.val || 0),
    totalGradesRecorded: Number(gradesRes[0]?.val || 0),
  };
}

// 10. Admin Dashboard summary stats
export async function getAdminGradeStats(schoolId: string) {
  const [assessmentsRes, gradesRes] = await Promise.all([
    db
      .select({ val: count() })
      .from(assessments)
      .where(and(eq(assessments.schoolId, schoolId), isNull(assessments.deletedAt))),
    db
      .select({ val: count() })
      .from(grades)
      .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
      .where(and(eq(assessments.schoolId, schoolId), isNull(assessments.deletedAt))),
  ]);

  return {
    totalAssessments: Number(assessmentsRes[0]?.val || 0),
    totalGradesRecorded: Number(gradesRes[0]?.val || 0),
  };
}
