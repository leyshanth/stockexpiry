import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Creating users table...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '1500'");
    
    // Check if users table exists
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (usersTableExists.rows[0].exists) {
      return NextResponse.json({
        success: true,
        message: "Users table already exists",
        next: "/api/create-user-1"
      });
    }
    
    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Created users table");
    
    return NextResponse.json({
      success: true,
      message: "Created users table",
      next: "/api/create-user-1"
    });
  } catch (error) {
    console.error("Create users table error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Create users table failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 