import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();

  console.log("DATABASE CONNECTION: OK");

  const info = await client.query(`
    SELECT current_database() AS database,
           current_user AS user
  `);

  console.log("DATABASE INFO:");
  console.table(info.rows);

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log(`PUBLIC TABLES: ${result.rows.length}`);
  console.table(result.rows);

  const migration = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
    ) AS exists
  `);

  console.log(
    "DRIZZLE MIGRATION TABLE:",
    migration.rows[0].exists ? "EXISTS" : "NOT FOUND"
  );

} catch (error) {
  console.error("DATABASE CHECK FAILED");
  console.error("code:", error?.code);
  console.error("message:", error?.message || "(empty)");
} finally {
  await client.end().catch(() => {});
}