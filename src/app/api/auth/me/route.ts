import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // In a real app, you would decode the session and verify it
    // For now, we'll just extract the user ID from the base64 encoded session
    const sessionData = Buffer.from(sessionCookie.value, 'base64').toString();
    const userId = sessionData.split(':')[0];
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }
    
    // Get user data - only select columns we know exist
    const result = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [userId]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Add an empty name property if it doesn't exist
    if (!user.name) {
      user.name = "";
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
} 