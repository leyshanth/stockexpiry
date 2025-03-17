import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if name column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `);
    
    // If name column doesn't exist, add it
    if (checkResult.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN name VARCHAR(255)
      `);
      return NextResponse.json({ message: "Added name column to users table" });
    }
    
    return NextResponse.json({ message: "Name column already exists" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "An error occurred during migration" },
      { status: 500 }
    );
  }
} 