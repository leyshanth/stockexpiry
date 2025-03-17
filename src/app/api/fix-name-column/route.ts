import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Fixing name column in users table...");
    
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
      return NextResponse.json({
        success: false,
        message: "Users table doesn't exist"
      });
    }
    
    // Get the columns in the users table
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log("Users table columns:", columns);
    
    // Check if name column exists
    if (!columns.includes('name')) {
      console.log("Adding name column to users table");
      await pool.query(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
      
      // Update existing users with a default name
      await pool.query(`
        UPDATE users 
        SET name = 'User ' || id 
        WHERE name IS NULL OR name = ''
      `);
      
      return NextResponse.json({
        success: true,
        message: "Added name column to users table",
        columns: columns,
        newColumns: [...columns, 'name']
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Name column already exists in users table",
      columns: columns
    });
  } catch (error) {
    console.error("Fix name column error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Fix name column failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 