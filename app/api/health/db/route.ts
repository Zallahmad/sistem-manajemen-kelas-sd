import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL belum dikonfigurasi di server.",
        },
        { status: 500 }
      );
    }

    // Execute simple query to test connection without exposing internals
    await db.execute(sql`SELECT 1`);

    return NextResponse.json(
      {
        success: true,
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL belum dikonfigurasi di server.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
