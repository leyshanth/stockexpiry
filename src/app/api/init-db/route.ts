import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db-init";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: "Database initialized successfully" });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      { error: "Failed to initialize database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 