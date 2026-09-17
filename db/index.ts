import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export * from "./schema";

function getDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === "") {
    throw new Error("DATABASE_URL_MISSING");
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const client = getDatabaseClient();
    return Reflect.get(client, prop);
  },
});

export { getDatabaseClient };
