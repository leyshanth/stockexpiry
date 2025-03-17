import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Fixing users table...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Check if users table exists
    const userTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!userTableExists.rows[0].exists) {
      console.log("Users table doesn't exist, creating it");
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create a test user
      const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
      await pool.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Test User', 'test@example.com', $1)
      `, [hashedPassword]);
      
      console.log("Created users table with test user");
      
      return NextResponse.json({
        success: true,
        message: "Created users table with test user"
      });
    }
    
    // Check if name column exists
    const nameColumnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
      )
    `);
    
    if (!nameColumnExists.rows[0].exists) {
      console.log("Name column doesn't exist in users table, adding it");
      await pool.query(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
      await pool.query(`UPDATE users SET name = 'User ' || id WHERE name IS NULL`);
      console.log("Added name column to users table");
      
      return NextResponse.json({
        success: true,
        message: "Added name column to users table"
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Users table is already set up correctly"
    });
  } catch (error) {
    console.error("Fix users table error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Fix users table failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 