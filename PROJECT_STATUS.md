# SISTEM MANAJEMEN KELAS SD — PROJECT STATUS

Dokumentasi checkpoint kondisi aktual proyek sistem manajemen kelas, dokumen pembelajaran, dan presensi/penilaian berbasis Next.js 16, Neon PostgreSQL, Drizzle ORM, dan Google Gemini API.

---

## 1. Stack & Environment
Berdasarkan `package.json` aktual:
- **Framework**: Next.js 16.3.5 (App Router, Server Components & Server Actions)
- **Library UI**: React 19.2.8 & React DOM 19.2.8 (React Compiler enabled)
- **Language**: TypeScript 5.x (`strict: true`, path alias `@/*`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss` ^4)
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless` ^1.1.0)
- **ORM & Migrations**: Drizzle ORM (`drizzle-orm` ^0.45.2) & Drizzle Kit (`drizzle-kit` ^0.31.10)
- **AI Provider**: Google Gemini API via Official SDK `@google/genai` (^2.23.0)
- **Authentication & Security**: `jose` (^6.2.12) untuk signed/encrypted stateless JWT sessions, `bcryptjs` (^3.0.3) untuk password hashing
- **Validation**: Zod (`zod` ^4.6.5)

---

## 2. Status Task

| Task | Modul | Status |
| :--- | :--- | :--- |
| **01** | **Gemini API** | **COMPLETED** |
| **02** | **Neon + Drizzle** | **COMPLETED** |
| **03** | **Database Schema** | **COMPLETED** |
| **04** | **Authentication + RBAC** | **COMPLETED** |
| **05** | **Dashboard + Data Master** | **COMPLETED** |
| **06** | **Jadwal Pelajaran** | **COMPLETED** |
| **07** | **Absensi Siswa** | **COMPLETED** |
| **08** | **Penilaian & Nilai** | **COMPLETED** |
| **09** | **Modul Ajar** | **COMPLETED** |
| **10** | **RPP** | **COMPLETED** |
| **11** | **LKPD** | **COMPLETED** |
| 12 | Jadwal Piket + AI | PLANNED |
| 13 | Bank Soal | PLANNED |
| 14 | AI Assistant Gemini | PLANNED |
| 15 | Laporan & Export | PLANNED |

---

## 3. Detail Task yang Sudah Selesai

### TASK 01: Gemini API
- **Arsitektur AI**: Terpusat di `lib/ai/gemini.ts` menggunakan SDK `@google/genai` (`GoogleGenAI`).
- **Keamanan**: Model default `gemini-2.5-flash` dengan pembacaan server-side `GEMINI_API_KEY`. API key tidak diekspos ke client/browser.
- **Endpoint & UI Testing**: `app/api/ai/test/route.ts` (POST dengan validasi Zod) dan halaman uji coba `app/ai-test/page.tsx` (Bahasa Indonesia).
- **Error Mapping**: Pemetaan error terstruktur untuk status `429` (kuota/rate limit), `401/403` (invalid key), `503/504` (timeout), dan error upstream.

### TASK 02: Neon + Drizzle
- **Koneksi Database**: Inisialisasi terpusat di `db/index.ts` menggunakan driver HTTP `@neondatabase/serverless` dan `drizzle-orm/neon-http`.
- **Konfigurasi Drizzle Kit**: `drizzle.config.ts` menunjuk ke schema `db/schema.ts` dan output `./drizzle`.
- **Health Check Endpoint**: `GET /api/health/db` yang mengeksekusi `SELECT 1` secara aman tanpa mengekspos kredensial/stack trace.

### TASK 03: Database Schema
- **File Schema**: `db/schema.ts` mendefinisikan 25 tabel lengkap dengan 11 PostgreSQL enums, relasi, foreign keys, composite indexes, dan soft delete partial unique indexes.
- **Migration SQL**: `drizzle/0000_eager_black_panther.sql` dibuat melalui `npx drizzle-kit generate`.

### TASK 04: Authentication + RBAC
- **Password**: Hashing dan verifikasi menggunakan `bcryptjs` dengan salt rounds 12 (`lib/auth/password.ts`).
- **Session & JWT**: Menggunakan `jose` (`SignJWT` / `jwtVerify` dengan HS256) disimpan pada HttpOnly cookie `session`, `sameSite: 'lax'`, `secure` pada mode produksi, masa aktif 7 hari (`lib/auth/session.ts`).
- **Core Auth & Permissions**: `lib/auth/auth.ts` (`authenticateUser`, `getCurrentUser`, `destroySession`), `lib/auth/permissions.ts` (`requireAuth`, `requireRole("ADMIN" | "GURU")`, `requireTeacherClassAccess`).
- **Middleware**: `middleware.ts` untuk routing guard awal `/admin/*` dan `/guru/*` serta proteksi `/login`.
- **Halaman Login**: `app/login/page.tsx` dan Server Action `app/login/actions.ts` dengan pesan error generik yang aman dari enumeration attacks.
- **Seed Script**: `scripts/seed-admin.ts` untuk generate akun admin development.

### TASK 05: Dashboard + Data Master
- **Layout Shell**: `components/layout/AppLayout.tsx` (Sidebar desktop responsif, mobile drawer, profil user, navigasi role-based, tombol logout).
- **Dashboard Admin**: `app/admin/page.tsx` dengan kartu statistik riil (`totalTeachers`, `totalStudents`, `totalClassrooms`, `totalSubjects`), periode aktif, dan feed audit aktivitas.
- **Master Data Admin**:
  - Sekolah: `app/admin/sekolah/page.tsx`
  - Tahun Ajaran: `app/admin/tahun-ajaran/page.tsx`
  - Semester: `app/admin/semester/page.tsx`
  - Guru: `app/admin/guru/page.tsx` (Akun User role GURU + Record Teacher via transaction)
  - Siswa: `app/admin/siswa/page.tsx` (Data pokok siswa, NIS/NISN, orang tua, soft delete)
  - Kelas: `app/admin/kelas/page.tsx` (Tingkat 1–6 SD, kapasitas, wali kelas)
  - Mata Pelajaran: `app/admin/mata-pelajaran/page.tsx`
  - Penugasan Guru: `app/admin/penugasan-guru/page.tsx` (`teacher_class_assignments`)
- **Dashboard Guru**: `app/guru/page.tsx`, `app/guru/kelas/page.tsx`, detail kelas `app/guru/kelas/[id]/page.tsx` (terproteksi `requireTeacherClassAccess`), dan `app/guru/siswa/page.tsx`.
- **Data Access Layer (DAL)**: `lib/data/schools.ts`, `lib/data/academic-years.ts`, `lib/data/semesters.ts`, `lib/data/teachers.ts`, `lib/data/students.ts`, `lib/data/classrooms.ts`, `lib/data/subjects.ts`, `lib/data/assignments.ts`, `lib/data/guru.ts`.

### TASK 06: Jadwal Pelajaran
- **DAL Jadwal**: `lib/data/schedules.ts` menyediakan filter jadwal, jadwal mingguan guru (`getTeacherWeeklySchedules`), dan jadwal hari ini (`getTeacherTodaySchedules`).
- **Deteksi Bentrok**: Fungsi `checkScheduleConflict()` memeriksa overlap rentang waktu (`start < newEnd AND end > newStart`) untuk mencegah bentrok guru, bentrok kelas, dan bentrok ruangan.
- **Halaman Admin**: `app/admin/jadwal/page.tsx` dengan filter multi-dimensi (Hari, Kelas, Guru, Mapel, Tahun) dan modal tambah jadwal (`app/admin/jadwal/ScheduleClientComponents.tsx`).
- **Halaman Guru**: `app/guru/jadwal/page.tsx` menampilkan agenda mingguan Senin–Sabtu.

### TASK 07: Absensi Siswa
- **DAL Absensi**: `lib/data/attendance.ts` (jadwal presensi guru, data sesi siswa aktif, riwayat guru, rekap kelas dan rekap siswa admin).
- **Server Action**: `app/guru/absensi/actions.ts` (`saveAttendanceAction`) menangani penyimpanan presensi secara atomik dengan validasi enrollment aktif dan pencatatan audit log.
- **Halaman Guru**: `app/guru/absensi/page.tsx`, `app/guru/absensi/[scheduleId]/page.tsx`, `app/guru/absensi/riwayat/page.tsx`.
- **Formulir Interaktif**: `app/guru/absensi/AttendanceClientForm.tsx` dengan tombol status (Hadir, Sakit, Izin, Alpa, Terlambat), aksi massal, dan catatan per siswa.
- **Halaman Admin**: `app/admin/absensi/page.tsx` (Tab: Rekap Per Kelas, Rekap Per Siswa, Daftar Sesi Presensi).

### TASK 08: Penilaian & Nilai
- **DAL Nilai**: `lib/data/grades.ts` (asesmen guru dengan filter, data input nilai, rekap detail per asesmen, rekap nilai akumulatif per siswa, rekap nilai kelas admin).
- **Server Actions**: `app/guru/nilai/actions.ts` (`createAssessmentAction`, `saveGradesAction`, `deactivateAssessmentAction`).
- **Komponen Asesmen**: Tipe `DAILY`, `QUIZ`, `MIDTERM`, `FINAL`, `PROJECT`, `ASSIGNMENT`, `PRACTICAL` dengan validasi rentang skor ($0 \le \text{skor} \le \text{maxScore}$).
- **Bulk Input Form**: `app/guru/nilai/GradeInputForm.tsx` dengan atomic upsert ke tabel `grades`.
- **Halaman Guru**:
  - `app/guru/nilai/page.tsx`: Daftar komponen penilaian.
  - `app/guru/nilai/[assessmentId]/page.tsx`: Input nilai siswa per asesmen.
  - `app/guru/nilai/[assessmentId]/rekap/page.tsx`: Rekapitulasi statistik satu asesmen (Rata-rata, Tertinggi, Terendah, Persentase).
  - `app/guru/nilai/siswa/page.tsx`: Akumulasi capaian nilai siswa binaan.
- **Halaman Admin**: `app/admin/nilai/page.tsx` (Tab: Rekap Nilai Per Kelas, Rekap Nilai Per Siswa, Daftar Komponen Penilaian Guru).

### TASK 09: Modul Ajar
- **DAL Modul Ajar**: `lib/data/teaching-modules.ts` (query filter guru, detail modul ajar dengan relasi lengkap, riwayat snapshot versi dokumen, filter monitoring admin, dan agregasi statistik modul ajar guru/admin).
- **Struktur Dokumen JSONB**: Tipe data TypeScript komprehensif `TeachingModuleContent` menyimpan 8 bagian utama: Identitas & Info Umum (termasuk fase otomatis SD), Komponen Pembelajaran & Profil Pelajar Pancasila, Urutan Langkah Kegiatan (Pendahuluan, Inti, Penutup), Asesmen & KKTP, Diferensiasi & Tindak Lanjut (Remedial/Pengayaan), Refleksi Guru & Siswa, serta Lampiran (LKPD, Glosarium, Daftar Pustaka).
- **Server Actions Atomik**: `app/guru/modul-ajar/actions.ts` (`createTeachingModuleAction`, `updateTeachingModuleAction`, `publishTeachingModuleAction`, `deactivateTeachingModuleAction`).
- **Atomic Versioning & Immutability**: Pembuatan modul secara atomik mencatat snapshot `v1` di tabel `document_versions`. Setiap pembaruan (update) memicu penambahan nomor versi baru (`v2`, `v3`, dst.) tanpa mengubah snapshot versi lama.
- **Soft Delete & Audit Logging**: Deaktivasi modul menerapkan soft delete (`deletedAt` dan status `ARCHIVED`) serta mencatat jejak audit trail pada tabel `audit_logs` (`CREATE_TEACHING_MODULE`, `UPDATE_TEACHING_MODULE`, `PUBLISH_TEACHING_MODULE`, `DEACTIVATE_TEACHING_MODULE`).
- **Halaman Guru**:
  - `app/guru/modul-ajar/page.tsx`: Daftar perangkat ajar guru, filter pencarian judul/topik/kelas/mapel/status/periode, kartu statistik kuantitatif.
  - `app/guru/modul-ajar/new/page.tsx`: Form pembuatan Modul Ajar baru.
  - `app/guru/modul-ajar/[id]/page.tsx`: Form telaah & edit Modul Ajar dengan tab navigasi interaktif dan riwayat snapshot versi.
  - `app/guru/modul-ajar/[id]/preview/page.tsx`: Tampilan dokumen resmi siap cetak (*print-ready*) dengan layout media print yang bersih dari elemen navigasi/tombol.
- **Halaman Admin**:
  - `app/admin/modul-ajar/page.tsx`: Monitoring & supervisi seluruh perangkat modul ajar guru dalam batas tenant sekolah.
  - `app/admin/modul-ajar/[id]/page.tsx`: Detail telaah dokumen dan inspeksi snapshot versi historis.
- **Dashboard & Navigasi**: Menu navigasi `AppLayout.tsx` dan kartu ringkasan dashboard guru/admin diperbarui secara proporsional.

### TASK 10: RPP (Rencana Pelaksanaan Pembelajaran)
- **DAL RPP**: `lib/data/lesson-plans.ts` (query filter guru, detail RPP lengkap dengan relasi, riwayat snapshot versi dokumen, filter monitoring admin, dan agregasi statistik RPP guru/admin).
- **Struktur Dokumen JSONB**: Tipe data TypeScript `LessonPlanContent` memuat 8 bagian: Identitas Program & Metode Pembelajaran (Model, Metode, Pendekatan Saintifik/TPACK), Capaian & Tujuan Pembelajaran (CP/TP + Profil Pancasila), Pemahaman Bermakna & Pertanyaan Pemantik, Media & Sumber Belajar, Skenario Rinci Kegiatan (Pendahuluan: orientasi/apersepsi/motivasi, Inti: eksplorasi/elaborasi/praktik/penerapan, Penutup: refleksi/kesimpulan/tindak lanjut beserta alokasi menit), Asesmen & KKTP, Diferensiasi & Remedial/Pengayaan, Refleksi Guru & Siswa, serta Lampiran (LKPD, Bacaan, Glosarium, Pustaka).
- **Server Actions Atomik**: `app/guru/rpp/actions.ts` (`createLessonPlanAction`, `updateLessonPlanAction`, `publishLessonPlanAction`, `deactivateLessonPlanAction`).
- **Atomic Versioning & Immutability**: Pembuatan RPP secara atomik mencatat snapshot `v1` di tabel `document_versions` (`documentType = "LESSON_PLAN"`). Setiap update RPP menaikkan nomor versi (`v2`, `v3`, dst.) dan menyimpannya secara atomik tanpa mengubah snapshot historis.
- **Soft Delete & Audit Trail**: Deaktivasi RPP menerapkan soft delete (`deletedAt` dan status `ARCHIVED`) serta mencatat jejak audit pada `audit_logs` (`CREATE_LESSON_PLAN`, `UPDATE_LESSON_PLAN`, `PUBLISH_LESSON_PLAN`, `DEACTIVATE_LESSON_PLAN`).
- **Halaman Guru**:
  - `app/guru/rpp/page.tsx`: Daftar RPP guru, filter pencarian judul/topik/kelas/mapel/status/periode, kartu statistik kuantitatif.
  - `app/guru/rpp/new/page.tsx`: Form pembuatan RPP baru.
  - `app/guru/rpp/[id]/page.tsx`: Form telaah & edit RPP dengan tab navigasi interaktif dan riwayat snapshot versi.
  - `app/guru/rpp/[id]/preview/page.tsx`: Preview dokumen resmi RPP siap cetak (*print-ready*) dengan layout media print yang rapi.
- **Halaman Admin**:
  - `app/admin/rpp/page.tsx`: Monitoring & supervisi seluruh dokumen RPP guru dalam batas tenant sekolah.
  - `app/admin/rpp/[id]/page.tsx`: Detail supervisi RPP dan inspeksi riwayat versi admin.
- **Dashboard & Navigasi**: Menu navigasi `AppLayout.tsx` dan kartu ringkasan dashboard guru/admin diperbarui secara proporsional.

### TASK 11: LKPD (Lembar Kerja Peserta Didik)
- **DAL LKPD**: `lib/data/worksheets.ts` (query filter guru, detail LKPD dengan relasi lengkap, riwayat snapshot versi dokumen, filter monitoring admin, dan agregasi statistik LKPD guru/admin).
- **Struktur Dokumen JSONB**: Tipe data TypeScript `WorksheetContent` memuat: Identitas Lembar Kerja (Fase A/B/C otomatis), Petunjuk Umum & Tujuan Kegiatan, Rangkuman Materi Singkat, Daftar Aktivitas Dinamis (Diskusi, Observasi, Eksperimen, Praktik, dsb.), Daftar Butir Soal Interaktif (Isian Singkat, Pilihan Ganda, Uraian, dsb.), Kriteria Penilaian & Rubrik Guru, Refleksi Siswa & Guru, serta Lampiran Pendukung.
- **Server Actions Atomik**: `app/guru/lkpd/actions.ts` (`createWorksheetAction`, `updateWorksheetAction`, `publishWorksheetAction`, `deactivateWorksheetAction`).
- **Atomic Versioning & Immutability**: Pembuatan LKPD secara atomik mencatat snapshot `v1` di tabel `document_versions` (`documentType = "WORKSHEET"`). Setiap update menaikkan nomor versi (`v2`, `v3`, dst.) dan menyimpannya secara atomik ke tabel `document_versions`. Snapshot versi terdahulu bersifat **immutable** (tidak ditimpa).
- **Soft Delete & Audit Trail**: Deaktivasi LKPD menerapkan soft delete (`deletedAt` dan status `ARCHIVED`) serta mencatat jejak audit pada `audit_logs` (`CREATE_WORKSHEET`, `UPDATE_WORKSHEET`, `PUBLISH_WORKSHEET`, `DEACTIVATE_WORKSHEET`).
- **Halaman Guru**:
  - `app/guru/lkpd/page.tsx`: Daftar LKPD guru, filter pencarian judul/topik/kelas/mapel/status/periode, kartu statistik kuantitatif.
  - `app/guru/lkpd/new/page.tsx`: Form pembuatan LKPD baru dengan builder aktivitas & soal fleksibel.
  - `app/guru/lkpd/[id]/page.tsx`: Form telaah & edit LKPD dengan tab navigasi interaktif dan riwayat snapshot versi.
  - `app/guru/lkpd/[id]/preview/page.tsx`: Preview dokumen resmi LKPD siap cetak (*print-ready*) dengan kop sekolah, kotak identitas nama siswa, lembar kerja, dan rubrik penilaian yang bersih dari elemen tombol navigasi saat diprint.
- **Halaman Admin**:
  - `app/admin/lkpd/page.tsx`: Monitoring & supervisi seluruh dokumen LKPD guru dalam batas tenant sekolah.
  - `app/admin/lkpd/[id]/page.tsx`: Detail supervisi LKPD dan inspeksi riwayat versi admin.
- **Dashboard & Navigasi**: Menu navigasi `AppLayout.tsx` dan kartu ringkasan dashboard guru/admin diperbarui secara proporsional.

---

## 4. Struktur Database & Tabel (Neon PostgreSQL)

Total **25 Tabel** terdaftar di `db/schema.ts`:
1. `schools`: Identitas sekolah dasar, NPSN, alamat, kontak.
2. `users`: Akun login pengguna (role `ADMIN` / `GURU`), email, password hash bcrypt, status aktif.
3. `teachers`: Biodata tenaga pendidik yang berelasi 1:1 dengan `users` (`user_id`) dan `schools`.
4. `academic_years`: Tahun ajaran (contoh: 2026/2027), tanggal mulai/selesai, status aktif.
5. `semesters`: Semester `GANJIL` (1) dan `GENAP` (2) terikat pada tahun ajaran.
6. `classrooms`: Rombongan belajar, tingkat (1–6 SD), kapasitas, nama ruangan, dan wali kelas (`homeroom_teacher_id`).
7. `subjects`: Master mata pelajaran kurikulum SD (kode & nama).
8. `teacher_class_assignments`: Penugasan guru ke rombongan belajar per tahun ajaran.
9. `students`: Biodata peserta didik, NIS, NISN, jenis kelamin, orang tua/wali.
10. `student_class_enrollments`: Histori penempatan kelas siswa per tahun ajaran (`ACTIVE`, `TRANSFERRED`, `GRADUATED`, `REPEATED`).
11. `schedules`: Jadwal belajar mengajar mingguan menghubungkan tahun ajaran, semester, kelas, guru, mapel, hari, jam, dan ruangan.
12. `attendance`: Header sesi presensi harian per kelas, guru, dan tanggal.
13. `attendance_records`: Detail presensi per siswa (`PRESENT`, `SICK`, `PERMISSION`, `ABSENT`, `LATE`) dan catatan individu.
14. `assessments`: Komponen penilaian (Ulangan Harian, Kuis, PTS, PAS, Proyek, Tugas, Praktik) dengan skor maksimal.
15. `grades`: Skor nilai siswa per asesmen dan catatan kompetensi.
16. `teaching_modules`: Dokumen Modul Ajar (title, topic, learning objectives, content JSONB, activities, assessment, status).
17. `lesson_plans`: Dokumen Rencana Pelaksanaan Pembelajaran / RPP (content JSONB, status).
18. `worksheets`: Dokumen Lembar Kerja Peserta Didik / LKPD (content JSONB, status).
19. `document_versions`: Histori versi perubahan dokumen pembelajaran (`TEACHING_MODULE`, `LESSON_PLAN`, `WORKSHEET`).
20. `duty_schedules`: Header jadwal piket kebersihan kelas per tahun ajaran.
21. `duty_assignments`: Penugasan piket harian siswa dan tugas spesifik.
22. `ai_generations`: Log histori generasi konten AI (fitur, model, prompt, result, status).
23. `ai_usage_logs`: Log monitoring kuota/token Gemini Free Tier (tokens, durasi, error code).
24. `notifications`: Notifikasi sistem untuk pengguna.
25. `audit_logs`: Audit trail keamanan mencatat aksi pengguna, entitas, payload perubahan, IP address, dan User Agent.

---

## 5. Aturan Otorisasi & Keamanan
- **Administrator (`ADMIN`)**:
  - Hak akses menyeluruh terhadap seluruh data master, rombongan belajar, jadwal, rekap presensi, dan rekap nilai di sekolahnya (`user.schoolId`).
  - Terisolasi penuh dari sekolah lain (*multi-tenant boundary*).
- **Pendidik (`GURU`)**:
  - Hanya dapat mengakses rombongan belajar yang resmi ditugaskan kepadanya melalui tabel `teacher_class_assignments`.
  - Mengakses detail kelas via `requireTeacherClassAccess(teacherId, classroomId)`.
  - Akses jadwal, presensi, asesmen, dan input nilai diverifikasi di sisi server berdasarkan `user.id` pada session token.
- **Security Boundary**:
  - File otorisasi: `lib/auth/permissions.ts`, `lib/auth/auth.ts`, `middleware.ts`.
  - Parameter `schoolId` dan `teacherId` tidak pernah dipercayai dari input client/URL; selalu diekstrak dari token session server yang didekripsi.

---

## 6. Daftar Route Aktual

### Area Publik & API
- `/` : Landing page default Next.js
- `/login` : Formulir masuk Administrator dan Guru
- `/ai-test` : Halaman uji coba server-side Gemini API
- `/api/health/db` : Endpoint health check koneksi database
- `/api/ai/test` : Route handler POST pengujian prompt Gemini

### Area Administrator (`/admin`)
- `/admin` : Dashboard utama Administrator
- `/admin/sekolah` : Master profil & identitas sekolah
- `/admin/tahun-ajaran` : Master tahun ajaran
- `/admin/semester` : Master semester
- `/admin/guru` : Master tenaga pendidik (Guru)
- `/admin/siswa` : Master peserta didik (Siswa)
- `/admin/kelas` : Master rombongan belajar (Kelas)
- `/admin/mata-pelajaran` : Master mata pelajaran
- `/admin/penugasan-guru` : Manajemen penugasan guru ke kelas
- `/admin/jadwal` : Manajemen jadwal pelajaran sekolah
- `/admin/absensi` : Rekapitulasi presensi sekolah (per kelas, per siswa, dan sesi)
- `/admin/nilai` : Rekapitulasi nilai sekolah (per kelas, per siswa, dan komponen)

### Area Guru (`/guru`)
- `/guru` : Dashboard utama Guru
- `/guru/kelas` : Daftar kelas binaan guru
- `/guru/kelas/[id]` : Ruang kelas & daftar siswa terdaftar
- `/guru/siswa` : Daftar siswa binaan saya
- `/guru/jadwal` : Jadwal mengajar mingguan saya
- `/guru/absensi` : Pilihan jadwal & pengisian presensi siswa
- `/guru/absensi/[scheduleId]` : Formulir presensi siswa
- `/guru/absensi/riwayat` : Riwayat presensi kelas guru
- `/guru/nilai` : Daftar komponen penilaian guru
- `/guru/nilai/[assessmentId]` : Formulir input nilai siswa massal
- `/guru/nilai/[assessmentId]/rekap` : Rekapitulasi statistik satu asesmen
- `/guru/nilai/siswa` : Rekapitulasi capaian nilai akumulatif per siswa

---

## 7. Direktori & File Penting

- `app/`: Route pages, layouts, dan Server Actions App Router Next.js 16.
- `components/`: Komponen UI modular (`components/layout/AppLayout.tsx`, `components/ui/Cards.tsx`, `components/ui/Modal.tsx`).
- `lib/auth/`: Modul hashing (`password.ts`), session JWT (`session.ts`), core auth (`auth.ts`), dan RBAC (`permissions.ts`).
- `lib/data/`: Data Access Layer terpusat (schools, academic-years, semesters, teachers, students, classrooms, subjects, assignments, guru, schedules, attendance, grades).
- `lib/ai/`: Integrasi terpusat Google Gemini API (`lib/ai/gemini.ts`).
- `db/`: Schema Drizzle ORM (`db/schema.ts`) dan inisialisasi client Neon (`db/index.ts`).
- `drizzle/`: File migrasi SQL (`0000_eager_black_panther.sql`) dan snapshot metadata.
- `scripts/`: Script utilitas development (`scripts/seed-admin.ts`).
- `middleware.ts`: Next.js middleware untuk routing dan proteksi session awal.
- `AGENTS.md`: Pedoman instruksi agent, framework constraints, dan panduan arsitektur Gemini API.

---

## 8. Next Task

### **NEXT TASK = TASK 12 — JADWAL PIKET + AI**
**Status**: `NOT STARTED`

Sebelum memulai coding pada **TASK 12**, wajib:
1. Membaca `AGENTS.md` dan aturan terbarunya.
2. Membaca struktur tabel `duty_schedules` dan `duty_assignments` di `db/schema.ts`.
3. Memeriksa relasi `duty_schedules` terhadap `schools`, `classrooms`, `academic_years`, `users`, dan `students`.
4. Menyiapkan Data Access Layer di `lib/data/duty-schedules.ts` dan Server Actions di `app/guru/piket/actions.ts` / `app/admin/piket/actions.ts`.

---

## 9. Catatan Desain & Konvensi Penting

1. **Server-Side AI Only**: Panggilan Gemini API wajib dieksekusi server-side menggunakan `@google/genai`. Kunci API `GEMINI_API_KEY` tidak boleh masuk bundle client.
2. **Session-Driven Identity**: Parameter `schoolId` dan `teacherId` selalu diambil dari session user terverifikasi untuk mencegah IDOR / privilege escalation.
3. **Soft Delete Policy**: Data penting (siswa, guru, kelas, mapel, jadwal, penilaian, dokumen) menggunakan field `deletedAt` guna menjaga integritas riwayat akademik.
4. **Atomic Transactions**: Operasi massal/multi-tabel (seperti penugasan guru, absensi, dan bulk grade input) dijalankan secara atomik.
5. **Data Access Layer (DAL)**: Semua query SQL/Drizzle dipusatkan di `lib/data/*`, tidak disebar di Client Components.
6. **Validasi Zod**: Semua Server Action dan input endpoint divalidasi ketat menggunakan Zod schema sebelum mutasi basis data.
7. **Bilingual Principle**: Penamaan database, kode TypeScript, variabel, dan file menggunakan Bahasa Inggris; antarmuka pengguna (UI/UX) dan pesan validasi/error menggunakan Bahasa Indonesia yang ramah sekolah dasar.
8. **Timezone**: Pengolahan tanggal operasional presensi dan jadwal menggunakan referensi timezone `Asia/Jakarta`.

---

## 10. IMPORTANT (Peringatan untuk Agent Selanjutnya)

- **Jangan mengarang field database**: Selalu merujuk langsung ke definisi field aktual di `db/schema.ts`.
- **Jangan mengekspos secrets**: Jangan pernah menuliskan isi nilai riil `DATABASE_URL`, `GEMINI_API_KEY`, atau `SESSION_SECRET` ke file source code atau dokumentasi.
- **Jangan merusak modul existing**: Task 01–08 harus tetap berjalan lancar dan bebas regresi saat task berikutnya dikembangkan.
- **Wajib Validasi Standar**: Setiap perubahan kode harus divalidasi dengan:
  ```bash
  npm run lint && npx tsc --noEmit && npm run build
  ```
- **Jangan melakukan Git commit/push otomatis**: Biarkan pengguna yang menentukan waktu eksekusi commit.
