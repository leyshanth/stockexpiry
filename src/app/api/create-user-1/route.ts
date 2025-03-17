import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Creating default user...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '1500'");
    
    // Check if users table exists
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!usersTableExists.rows[0].exists) {
      return NextResponse.json({
        success: false,
        error: "Users table does not exist. Please create it first."
      }, { status: 400 });
    }
    
    // Check if default user already exists
    const userExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE id = 1 OR email = 'default@example.com'
      )
    `);
    
    if (userExists.rows[0].exists) {
      return NextResponse.json({
        success: true,
        message: "Default user already exists"
      });
    }
    
    // Create a default user with ID 1
    const hashedPassword = await bcrypt.hash('password123', 10);
    await pool.query(`
      INSERT INTO users (id, name, email, password)
      VALUES (1, 'Default User', 'default@example.com', $1)
    `, [hashedPassword]);
    
    console.log("Created default user");
    
    return NextResponse.json({
      success: true,
      message: "Created default user"
    });
  } catch (error) {
    console.error("Create default user error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Create default user failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 