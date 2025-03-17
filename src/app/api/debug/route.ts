import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    
    // Check database connection
    const dbResult = await pool.query("SELECT NOW()");
    
    // Check users table
    const usersResult = await pool.query("SELECT COUNT(*) FROM users");
    
    // Check expiry_items table
    const expiryResult = await pool.query("SELECT COUNT(*) FROM expiry_items");
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      database: {
        connected: !!dbResult.rows[0],
        timestamp: dbResult.rows[0],
        userCount: usersResult.rows[0].count,
        expiryItemsCount: expiryResult.rows[0].count
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 