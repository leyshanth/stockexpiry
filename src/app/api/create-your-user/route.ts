import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Creating your user...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Check if your user exists
    const yourUserExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE email = 'leyshanth.1177@gmail.com'
      )
    `);
    
    if (yourUserExists.rows[0].exists) {
      return NextResponse.json({
        success: true,
        message: "Your user already exists"
      });
    }
    
    // Create your user
    const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
    await pool.query(`
      INSERT INTO users (name, email, password)
      VALUES ('Your Name', 'leyshanth.1177@gmail.com', $1)
    `, [hashedPassword]);
    
    console.log("Created your user");
    
    return NextResponse.json({
      success: true,
      message: "Created your user",
      next: "/api/fix-products-table"
    });
  } catch (error) {
    console.error("Create your user error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Create your user failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 