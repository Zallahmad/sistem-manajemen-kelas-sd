import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ==========================================
// 1. ENUMS
// ==========================================

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "GURU"]);

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE"]);

export const semesterTypeEnum = pgEnum("semester_type", ["GANJIL", "GENAP"]);

export const studentEnrollmentStatusEnum = pgEnum("student_enrollment_status", [
  "ACTIVE",
  "TRANSFERRED",
  "GRADUATED",
  "REPEATED",
]);

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PRESENT",
  "SICK",
  "PERMISSION",
  "ABSENT",
  "LATE",
]);

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "DAILY",
  "QUIZ",
  "MIDTERM",
  "FINAL",
  "PROJECT",
  "ASSIGNMENT",
  "PRACTICAL",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "TEACHING_MODULE",
  "LESSON_PLAN",
  "WORKSHEET",
]);

export const aiFeatureEnum = pgEnum("ai_feature", [
  "TEACHING_MODULE",
  "LESSON_PLAN",
  "WORKSHEET",
  "DUTY_SCHEDULE",
  "QUESTION",
  "OTHER",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "INFO",
  "WARNING",
  "SUCCESS",
  "ALERT",
]);

// ==========================================
// 2. SCHOOLS
// ==========================================

export const schools = pgTable(
  "schools",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    npsn: text("npsn"),
    name: text("name").notNull(),
    address: text("address"),
    village: text("village"),
    district: text("district"),
    regency: text("regency"),
    province: text("province"),
    postalCode: text("postal_code"),
    phone: text("phone"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("schools_npsn_unique")
      .on(table.npsn)
      .where(sql`${table.deletedAt} IS NULL AND ${table.npsn} IS NOT NULL`),
    index("schools_name_idx").on(table.name),
  ]
);

// ==========================================
// 3. USERS
// ==========================================

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("GURU").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_unique")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
    index("users_school_id_idx").on(table.schoolId),
    index("users_role_idx").on(table.role),
  ]
);

// ==========================================
// 4. TEACHERS
// ==========================================

export const teachers = pgTable(
  "teachers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    employeeNumber: text("employee_number"),
    fullName: text("full_name").notNull(),
    gender: genderEnum("gender"),
    birthPlace: text("birth_place"),
    birthDate: timestamp("birth_date", { mode: "string" }),
    phone: text("phone"),
    email: text("email"),
    position: text("position"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("teachers_user_id_unique")
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
    index("teachers_school_id_idx").on(table.schoolId),
    index("teachers_employee_number_idx").on(table.employeeNumber),
    index("teachers_full_name_idx").on(table.fullName),
  ]
);

// ==========================================
// 5. ACADEMIC YEARS
// ==========================================

export const academicYears = pgTable(
  "academic_years",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    name: text("name").notNull(), // e.g. 2026/2027
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }).notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("academic_years_school_id_idx").on(table.schoolId),
    uniqueIndex("academic_years_school_name_unique").on(table.schoolId, table.name),
  ]
);

// ==========================================
// 6. SEMESTERS
// ==========================================

export const semesters = pgTable(
  "semesters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    name: semesterTypeEnum("name").notNull(),
    number: integer("number").notNull(), // 1 or 2
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }).notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("semesters_academic_year_id_idx").on(table.academicYearId),
    uniqueIndex("semesters_year_type_unique").on(table.academicYearId, table.name),
    uniqueIndex("semesters_year_number_unique").on(table.academicYearId, table.number),
  ]
);

// ==========================================
// 7. CLASSROOMS
// ==========================================

export const classrooms = pgTable(
  "classrooms",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    name: text("name").notNull(), // e.g. 1A, 5B
    gradeLevel: integer("grade_level").notNull(), // 1 to 6 for SD
    homeroomTeacherId: text("homeroom_teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    capacity: integer("capacity").default(30),
    roomName: text("room_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("classrooms_school_id_idx").on(table.schoolId),
    index("classrooms_academic_year_id_idx").on(table.academicYearId),
    index("classrooms_homeroom_teacher_id_idx").on(table.homeroomTeacherId),
    uniqueIndex("classrooms_school_year_name_unique")
      .on(table.schoolId, table.academicYearId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

// ==========================================
// 8. SUBJECTS
// ==========================================

export const subjects = pgTable(
  "subjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    code: text("code").notNull(), // MAT, IPA, etc.
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("subjects_school_id_idx").on(table.schoolId),
    uniqueIndex("subjects_school_code_unique")
      .on(table.schoolId, table.code)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

// ==========================================
// 9. TEACHER CLASS ASSIGNMENTS
// ==========================================

export const teacherClassAssignments = pgTable(
  "teacher_class_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tca_teacher_id_idx").on(table.teacherId),
    index("tca_classroom_id_idx").on(table.classroomId),
    index("tca_academic_year_id_idx").on(table.academicYearId),
    uniqueIndex("tca_teacher_classroom_year_unique").on(
      table.teacherId,
      table.classroomId,
      table.academicYearId
    ),
  ]
);

// ==========================================
// 10. STUDENTS
// ==========================================

export const students = pgTable(
  "students",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    nis: text("nis"),
    nisn: text("nisn"),
    fullName: text("full_name").notNull(),
    gender: genderEnum("gender"),
    birthPlace: text("birth_place"),
    birthDate: timestamp("birth_date", { mode: "string" }),
    religion: text("religion"),
    address: text("address"),
    phone: text("phone"),
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("students_school_id_idx").on(table.schoolId),
    index("students_full_name_idx").on(table.fullName),
    uniqueIndex("students_school_nis_unique")
      .on(table.schoolId, table.nis)
      .where(sql`${table.deletedAt} IS NULL AND ${table.nis} IS NOT NULL`),
    uniqueIndex("students_nisn_unique")
      .on(table.nisn)
      .where(sql`${table.deletedAt} IS NULL AND ${table.nisn} IS NOT NULL`),
  ]
);

// ==========================================
// 11. STUDENT CLASS ENROLLMENTS
// ==========================================

export const studentClassEnrollments = pgTable(
  "student_class_enrollments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    status: studentEnrollmentStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sce_student_id_idx").on(table.studentId),
    index("sce_classroom_id_idx").on(table.classroomId),
    index("sce_academic_year_id_idx").on(table.academicYearId),
    uniqueIndex("sce_student_year_unique")
      .on(table.studentId, table.academicYearId)
      .where(sql`${table.status} = 'ACTIVE'`),
  ]
);

// ==========================================
// 12. SCHEDULES
// ==========================================

export const schedules = pgTable(
  "schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    semesterId: text("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    startTime: text("start_time").notNull(), // HH:mm format, e.g. 07:30
    endTime: text("end_time").notNull(), // HH:mm format, e.g. 09:00
    room: text("room"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("schedules_school_id_idx").on(table.schoolId),
    index("schedules_classroom_id_idx").on(table.classroomId),
    index("schedules_teacher_id_idx").on(table.teacherId),
    index("schedules_subject_id_idx").on(table.subjectId),
    index("schedules_academic_year_id_idx").on(table.academicYearId),
    index("schedules_semester_id_idx").on(table.semesterId),
    check("schedules_time_check", sql`${table.startTime} < ${table.endTime}`),
  ]
);

// ==========================================
// 13. ATTENDANCE & ATTENDANCE RECORDS
// ==========================================

export const attendance = pgTable(
  "attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    attendanceDate: timestamp("attendance_date", { mode: "string" }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("attendance_school_id_idx").on(table.schoolId),
    index("attendance_classroom_id_idx").on(table.classroomId),
    index("attendance_teacher_id_idx").on(table.teacherId),
    index("attendance_date_idx").on(table.attendanceDate),
    uniqueIndex("attendance_classroom_date_unique").on(
      table.classroomId,
      table.attendanceDate
    ),
  ]
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    attendanceId: text("attendance_id")
      .notNull()
      .references(() => attendance.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    status: attendanceStatusEnum("status").default("PRESENT").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ar_attendance_id_idx").on(table.attendanceId),
    index("ar_student_id_idx").on(table.studentId),
    uniqueIndex("ar_attendance_student_unique").on(
      table.attendanceId,
      table.studentId
    ),
  ]
);

// ==========================================
// 14. ASSESSMENTS & GRADES
// ==========================================

export const assessments = pgTable(
  "assessments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    semesterId: text("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    type: assessmentTypeEnum("type").default("DAILY").notNull(),
    assessmentDate: timestamp("assessment_date", { mode: "string" }).notNull(),
    description: text("description"),
    maxScore: numeric("max_score", { precision: 5, scale: 2 })
      .default("100.00")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("assessments_school_id_idx").on(table.schoolId),
    index("assessments_classroom_id_idx").on(table.classroomId),
    index("assessments_teacher_id_idx").on(table.teacherId),
    index("assessments_subject_id_idx").on(table.subjectId),
    index("assessments_academic_year_id_idx").on(table.academicYearId),
    index("assessments_semester_id_idx").on(table.semesterId),
  ]
);

export const grades = pgTable(
  "grades",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    score: numeric("score", { precision: 5, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("grades_assessment_id_idx").on(table.assessmentId),
    index("grades_student_id_idx").on(table.studentId),
    uniqueIndex("grades_assessment_student_unique").on(
      table.assessmentId,
      table.studentId
    ),
  ]
);

// ==========================================
// 15. TEACHING MODULES (MODUL AJAR)
// ==========================================

export const teachingModules = pgTable(
  "teaching_modules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    semesterId: text("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    learningObjectives: text("learning_objectives").notNull(),
    content: jsonb("content").notNull(), // Flexible structured document
    activities: jsonb("activities"),
    assessment: jsonb("assessment"),
    status: documentStatusEnum("status").default("DRAFT").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("tm_school_id_idx").on(table.schoolId),
    index("tm_teacher_id_idx").on(table.teacherId),
    index("tm_classroom_id_idx").on(table.classroomId),
    index("tm_subject_id_idx").on(table.subjectId),
    index("tm_status_idx").on(table.status),
  ]
);

// ==========================================
// 16. LESSON PLANS (RPP)
// ==========================================

export const lessonPlans = pgTable(
  "lesson_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    semesterId: text("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    status: documentStatusEnum("status").default("DRAFT").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("lp_school_id_idx").on(table.schoolId),
    index("lp_teacher_id_idx").on(table.teacherId),
    index("lp_classroom_id_idx").on(table.classroomId),
    index("lp_subject_id_idx").on(table.subjectId),
    index("lp_status_idx").on(table.status),
  ]
);

// ==========================================
// 17. WORKSHEETS (LKPD)
// ==========================================

export const worksheets = pgTable(
  "worksheets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    semesterId: text("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    status: documentStatusEnum("status").default("DRAFT").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("ws_school_id_idx").on(table.schoolId),
    index("ws_teacher_id_idx").on(table.teacherId),
    index("ws_classroom_id_idx").on(table.classroomId),
    index("ws_subject_id_idx").on(table.subjectId),
    index("ws_status_idx").on(table.status),
  ]
);

// ==========================================
// 18. DOCUMENT VERSIONS
// ==========================================

export const documentVersions = pgTable(
  "document_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentType: documentTypeEnum("document_type").notNull(),
    documentId: text("document_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    content: jsonb("content").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("dv_doc_type_id_idx").on(table.documentType, table.documentId),
    uniqueIndex("dv_type_id_version_unique").on(
      table.documentType,
      table.documentId,
      table.versionNumber
    ),
  ]
);

// ==========================================
// 19. DUTY SCHEDULES (JADWAL PIKET)
// ==========================================

export const dutySchedules = pgTable(
  "duty_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ds_school_id_idx").on(table.schoolId),
    index("ds_classroom_id_idx").on(table.classroomId),
    index("ds_academic_year_id_idx").on(table.academicYearId),
  ]
);

export const dutyAssignments = pgTable(
  "duty_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    dutyScheduleId: text("duty_schedule_id")
      .notNull()
      .references(() => dutySchedules.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    task: text("task").notNull(), // e.g. Membersihkan Papan Tulis, Menyapu
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("da_duty_schedule_id_idx").on(table.dutyScheduleId),
    index("da_student_id_idx").on(table.studentId),
  ]
);

// ==========================================
// 20. AI GENERATIONS & USAGE LOGS
// ==========================================

export const aiGenerations = pgTable(
  "ai_generations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    feature: aiFeatureEnum("feature").notNull(),
    model: text("model").notNull(),
    prompt: text("prompt").notNull(),
    result: text("result"),
    status: text("status").notNull(), // e.g. SUCCESS, ERROR
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_gen_school_id_idx").on(table.schoolId),
    index("ai_gen_user_id_idx").on(table.userId),
    index("ai_gen_feature_idx").on(table.feature),
    index("ai_gen_created_at_idx").on(table.createdAt),
  ]
);

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    provider: text("provider").default("GEMINI").notNull(),
    model: text("model").notNull(),
    feature: aiFeatureEnum("feature").notNull(),
    requestStatus: text("request_status").notNull(), // SUCCESS, 429_RATE_LIMIT, ERROR
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    durationMs: integer("duration_ms"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_usage_school_id_idx").on(table.schoolId),
    index("ai_usage_user_id_idx").on(table.userId),
    index("ai_usage_feature_idx").on(table.feature),
    index("ai_usage_created_at_idx").on(table.createdAt),
  ]
);

// ==========================================
// 21. NOTIFICATIONS
// ==========================================

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: notificationTypeEnum("type").default("INFO").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

// ==========================================
// 22. AUDIT LOGS
// ==========================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(), // e.g. CREATE, UPDATE, DELETE, LOGIN
    entityType: text("entity_type").notNull(), // e.g. STUDENT, GRADE, CLASSROOM
    entityId: text("entity_id").notNull(),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_school_id_idx").on(table.schoolId),
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

// ==========================================
// 23. DRIZZLE RELATIONS
// ==========================================

export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  teachers: many(teachers),
  students: many(students),
  subjects: many(subjects),
  academicYears: many(academicYears),
  classrooms: many(classrooms),
  schedules: many(schedules),
  attendance: many(attendance),
  assessments: many(assessments),
  teachingModules: many(teachingModules),
  lessonPlans: many(lessonPlans),
  worksheets: many(worksheets),
  dutySchedules: many(dutySchedules),
  aiGenerations: many(aiGenerations),
  aiUsageLogs: many(aiUsageLogs),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  teacher: one(teachers, {
    fields: [users.id],
    references: [teachers.userId],
  }),
  notifications: many(notifications),
  documentVersions: many(documentVersions),
  createdDutySchedules: many(dutySchedules),
  aiGenerations: many(aiGenerations),
  aiUsageLogs: many(aiUsageLogs),
  auditLogs: many(auditLogs),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [teachers.schoolId],
    references: [schools.id],
  }),
  homeroomClassrooms: many(classrooms),
  classAssignments: many(teacherClassAssignments),
  schedules: many(schedules),
  attendanceList: many(attendance),
  assessments: many(assessments),
  teachingModules: many(teachingModules),
  lessonPlans: many(lessonPlans),
  worksheets: many(worksheets),
}));

export const academicYearsRelations = relations(academicYears, ({ one, many }) => ({
  school: one(schools, {
    fields: [academicYears.schoolId],
    references: [schools.id],
  }),
  semesters: many(semesters),
  classrooms: many(classrooms),
  teacherClassAssignments: many(teacherClassAssignments),
  studentClassEnrollments: many(studentClassEnrollments),
  schedules: many(schedules),
  assessments: many(assessments),
  teachingModules: many(teachingModules),
  lessonPlans: many(lessonPlans),
  worksheets: many(worksheets),
  dutySchedules: many(dutySchedules),
}));

export const semestersRelations = relations(semesters, ({ one, many }) => ({
  academicYear: one(academicYears, {
    fields: [semesters.academicYearId],
    references: [academicYears.id],
  }),
  schedules: many(schedules),
  assessments: many(assessments),
  teachingModules: many(teachingModules),
  lessonPlans: many(lessonPlans),
  worksheets: many(worksheets),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  school: one(schools, {
    fields: [classrooms.schoolId],
    references: [schools.id],
  }),
  academicYear: one(academicYears, {
    fields: [classrooms.academicYearId],
    references: [academicYears.id],
  }),
  homeroomTeacher: one(teachers, {
    fields: [classrooms.homeroomTeacherId],
    references: [teachers.id],
  }),
  teacherAssignments: many(teacherClassAssignments),
  studentEnrollments: many(studentClassEnrollments),
  schedules: many(schedules),
  attendance: many(attendance),
  assessments: many(assessments),
  teachingModules: many(teachingModules),
  lessonPlans: many(lessonPlans),
  worksheets: many(worksheets),
  dutySchedules: many(dutySchedules),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  school: one(schools, {
    fields: [subjects.schoolId],
    references: [schools.id],
  }),
  schedules: many(schedules),
  assessments: many(assessments),
  teachingModules: many(teachingModules),
  lessonPlans: many(lessonPlans),
  worksheets: many(worksheets),
}));

export const teacherClassAssignmentsRelations = relations(
  teacherClassAssignments,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherClassAssignments.teacherId],
      references: [teachers.id],
    }),
    classroom: one(classrooms, {
      fields: [teacherClassAssignments.classroomId],
      references: [classrooms.id],
    }),
    academicYear: one(academicYears, {
      fields: [teacherClassAssignments.academicYearId],
      references: [academicYears.id],
    }),
  })
);

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  enrollments: many(studentClassEnrollments),
  attendanceRecords: many(attendanceRecords),
  grades: many(grades),
  dutyAssignments: many(dutyAssignments),
}));

export const studentClassEnrollmentsRelations = relations(
  studentClassEnrollments,
  ({ one }) => ({
    student: one(students, {
      fields: [studentClassEnrollments.studentId],
      references: [students.id],
    }),
    classroom: one(classrooms, {
      fields: [studentClassEnrollments.classroomId],
      references: [classrooms.id],
    }),
    academicYear: one(academicYears, {
      fields: [studentClassEnrollments.academicYearId],
      references: [academicYears.id],
    }),
  })
);

export const schedulesRelations = relations(schedules, ({ one }) => ({
  school: one(schools, {
    fields: [schedules.schoolId],
    references: [schools.id],
  }),
  academicYear: one(academicYears, {
    fields: [schedules.academicYearId],
    references: [academicYears.id],
  }),
  semester: one(semesters, {
    fields: [schedules.semesterId],
    references: [semesters.id],
  }),
  classroom: one(classrooms, {
    fields: [schedules.classroomId],
    references: [classrooms.id],
  }),
  teacher: one(teachers, {
    fields: [schedules.teacherId],
    references: [teachers.id],
  }),
  subject: one(subjects, {
    fields: [schedules.subjectId],
    references: [subjects.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  school: one(schools, {
    fields: [attendance.schoolId],
    references: [schools.id],
  }),
  classroom: one(classrooms, {
    fields: [attendance.classroomId],
    references: [classrooms.id],
  }),
  teacher: one(teachers, {
    fields: [attendance.teacherId],
    references: [teachers.id],
  }),
  records: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    attendance: one(attendance, {
      fields: [attendanceRecords.attendanceId],
      references: [attendance.id],
    }),
    student: one(students, {
      fields: [attendanceRecords.studentId],
      references: [students.id],
    }),
  })
);

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  school: one(schools, {
    fields: [assessments.schoolId],
    references: [schools.id],
  }),
  academicYear: one(academicYears, {
    fields: [assessments.academicYearId],
    references: [academicYears.id],
  }),
  semester: one(semesters, {
    fields: [assessments.semesterId],
    references: [semesters.id],
  }),
  classroom: one(classrooms, {
    fields: [assessments.classroomId],
    references: [classrooms.id],
  }),
  teacher: one(teachers, {
    fields: [assessments.teacherId],
    references: [teachers.id],
  }),
  subject: one(subjects, {
    fields: [assessments.subjectId],
    references: [subjects.id],
  }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  assessment: one(assessments, {
    fields: [grades.assessmentId],
    references: [assessments.id],
  }),
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
}));

export const teachingModulesRelations = relations(teachingModules, ({ one }) => ({
  school: one(schools, {
    fields: [teachingModules.schoolId],
    references: [schools.id],
  }),
  teacher: one(teachers, {
    fields: [teachingModules.teacherId],
    references: [teachers.id],
  }),
  classroom: one(classrooms, {
    fields: [teachingModules.classroomId],
    references: [classrooms.id],
  }),
  subject: one(subjects, {
    fields: [teachingModules.subjectId],
    references: [subjects.id],
  }),
  academicYear: one(academicYears, {
    fields: [teachingModules.academicYearId],
    references: [academicYears.id],
  }),
  semester: one(semesters, {
    fields: [teachingModules.semesterId],
    references: [semesters.id],
  }),
}));

export const lessonPlansRelations = relations(lessonPlans, ({ one }) => ({
  school: one(schools, {
    fields: [lessonPlans.schoolId],
    references: [schools.id],
  }),
  teacher: one(teachers, {
    fields: [lessonPlans.teacherId],
    references: [teachers.id],
  }),
  classroom: one(classrooms, {
    fields: [lessonPlans.classroomId],
    references: [classrooms.id],
  }),
  subject: one(subjects, {
    fields: [lessonPlans.subjectId],
    references: [subjects.id],
  }),
  academicYear: one(academicYears, {
    fields: [lessonPlans.academicYearId],
    references: [academicYears.id],
  }),
  semester: one(semesters, {
    fields: [lessonPlans.semesterId],
    references: [semesters.id],
  }),
}));

export const worksheetsRelations = relations(worksheets, ({ one }) => ({
  school: one(schools, {
    fields: [worksheets.schoolId],
    references: [schools.id],
  }),
  teacher: one(teachers, {
    fields: [worksheets.teacherId],
    references: [teachers.id],
  }),
  classroom: one(classrooms, {
    fields: [worksheets.classroomId],
    references: [classrooms.id],
  }),
  subject: one(subjects, {
    fields: [worksheets.subjectId],
    references: [subjects.id],
  }),
  academicYear: one(academicYears, {
    fields: [worksheets.academicYearId],
    references: [academicYears.id],
  }),
  semester: one(semesters, {
    fields: [worksheets.semesterId],
    references: [semesters.id],
  }),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  author: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id],
  }),
}));

export const dutySchedulesRelations = relations(dutySchedules, ({ one, many }) => ({
  school: one(schools, {
    fields: [dutySchedules.schoolId],
    references: [schools.id],
  }),
  classroom: one(classrooms, {
    fields: [dutySchedules.classroomId],
    references: [classrooms.id],
  }),
  academicYear: one(academicYears, {
    fields: [dutySchedules.academicYearId],
    references: [academicYears.id],
  }),
  author: one(users, {
    fields: [dutySchedules.createdBy],
    references: [users.id],
  }),
  assignments: many(dutyAssignments),
}));

export const dutyAssignmentsRelations = relations(dutyAssignments, ({ one }) => ({
  dutySchedule: one(dutySchedules, {
    fields: [dutyAssignments.dutyScheduleId],
    references: [dutySchedules.id],
  }),
  student: one(students, {
    fields: [dutyAssignments.studentId],
    references: [students.id],
  }),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  school: one(schools, {
    fields: [aiGenerations.schoolId],
    references: [schools.id],
  }),
  user: one(users, {
    fields: [aiGenerations.userId],
    references: [users.id],
  }),
}));

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  school: one(schools, {
    fields: [aiUsageLogs.schoolId],
    references: [schools.id],
  }),
  user: one(users, {
    fields: [aiUsageLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  school: one(schools, {
    fields: [auditLogs.schoolId],
    references: [schools.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
