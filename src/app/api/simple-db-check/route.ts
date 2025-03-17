import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Running simple database check...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '1500'");
    
    // Check connection
    const connectionTest = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", connectionTest.rows[0].now);
    
    // Check users table
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!usersTableExists.rows[0].exists) {
      return NextResponse.json({
        success: true,
        connection: "Connected to database",
        timestamp: connectionTest.rows[0].now,
        usersTableExists: false,
        suggestion: "Visit /api/create-users-table to create the users table"
      });
    }
    
    // Check if user with ID 1 exists
    const user1Exists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE id = 1
      )
    `);
    
    return NextResponse.json({
      success: true,
      connection: "Connected to database",
      timestamp: connectionTest.rows[0].now,
      usersTableExists: true,
      user1Exists: user1Exists.rows[0].exists,
      suggestion: user1Exists.rows[0].exists ? 
        "Database looks good" : 
        "Visit /api/create-user-1 to create user with ID 1"
    });
  } catch (error) {
    console.error("Simple database check error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Simple database check failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 