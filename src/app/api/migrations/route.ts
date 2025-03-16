import { NextResponse } from "next/server";
import { createDeletedTables } from "./create-deleted-tables";
import { createTables } from "./create-tables";

export async function GET() {
  try {
    await createTables();
    await createDeletedTables();
    return NextResponse.json({ message: "Migrations completed successfully" });
  } catch (error) {
    console.error("Error running migrations:", error);
    return NextResponse.json(
      { error: "Failed to run migrations" },
      { status: 500 }
    );
  }
} 