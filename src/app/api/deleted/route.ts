import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Get all deleted items for the logged-in user
export async function GET() {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Extract user ID from session
    const sessionData = Buffer.from(sessionCookie.value, 'base64').toString();
    const userId = sessionData.split(':')[0];
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }
    
    // Get deleted items for the user
    const result = await pool.query(
      `SELECT * FROM deleted_items WHERE user_id = $1`,
      [userId]
    );
    
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching deleted items:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
} 