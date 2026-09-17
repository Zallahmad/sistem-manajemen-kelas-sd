import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../db/schema";
import { schools, users } from "../db/schema";

async function seedAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === "") {
    console.error("Error: DATABASE_URL tidak ditemukan di environment variables.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@sekolah.sch.id").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const adminName = process.env.ADMIN_NAME || "Administrator Utama";
  let schoolId = process.env.ADMIN_SCHOOL_ID;

  console.log("Memulai proses seed akun Admin Development...");

  // 1. Dapatkan atau buat sekolah default jika schoolId tidak ditentukan
  if (!schoolId || schoolId.trim() === "") {
    const existingSchools = await db
      .select({ id: schools.id })
      .from(schools)
      .where(isNull(schools.deletedAt))
      .limit(1);

    if (existingSchools.length > 0) {
      schoolId = existingSchools[0].id;
      console.log(`Menggunakan sekolah yang sudah ada dengan ID: ${schoolId}`);
    } else {
      const newSchools = await db
        .insert(schools)
        .values({
          npsn: "12345678",
          name: "SD Negeri Contoh 01",
          address: "Jl. Pendidikan No. 1",
          district: "Kecamatan Edukasi",
          regency: "Kota Belajar",
          province: "Provinsi Cerdas",
        })
        .returning({ id: schools.id });

      schoolId = newSchools[0].id;
      console.log(`Sekolah baru berhasil dibuat dengan ID: ${schoolId}`);
    }
  }

  // 2. Periksa apakah user dengan email tersebut sudah ada
  const existingUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.email, adminEmail), isNull(users.deletedAt)))
    .limit(1);

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existingUsers.length > 0) {
    await db
      .update(users)
      .set({
        name: adminName,
        passwordHash,
        role: "ADMIN",
        isActive: true,
        schoolId,
      })
      .where(eq(users.id, existingUsers[0].id));

    console.log(`Akun Admin (${adminEmail}) berhasil diperbarui.`);
  } else {
    await db.insert(users).values({
      schoolId,
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "ADMIN",
      isActive: true,
    });

    console.log(`Akun Admin baru (${adminEmail}) berhasil dibuat.`);
  }

  console.log("--- SEED SELESAI ---");
  console.log(`Email: ${adminEmail}`);
  console.log(`Role: ADMIN`);
}

seedAdmin().catch((err) => {
  console.error("Gagal menjalankan seed admin:", err);
  process.exit(1);
});
