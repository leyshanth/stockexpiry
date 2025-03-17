import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Creating user with ID 1...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Check if user with ID 1 exists
    const user1Exists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE id = 1
      )
    `);
    
    if (user1Exists.rows[0].exists) {
      return NextResponse.json({
        success: true,
        message: "User with ID 1 already exists"
      });
    }
    
    // Create user with ID 1
    const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
    
    // Check if the sequence is already past 1
    const maxIdResult = await pool.query(`SELECT MAX(id) FROM users`);
    const maxId = maxIdResult.rows[0].max || 0;
    
    if (maxId > 1) {
      // We need to temporarily disable the sequence check
      await pool.query(`ALTER TABLE users ALTER COLUMN id DROP DEFAULT`);
      await pool.query(`
        INSERT INTO users (id, name, email, password)
        VALUES (1, 'Default User', 'default@example.com', $1)
      `, [hashedPassword]);
      await pool.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq')`);
    } else {
      // We can just insert the user with ID 1
      await pool.query(`
        INSERT INTO users (id, name, email, password)
        VALUES (1, 'Default User', 'default@example.com', $1)
      `, [hashedPassword]);
    }
    
    console.log("Created user with ID 1");
    
    return NextResponse.json({
      success: true,
      message: "Created user with ID 1",
      next: "/api/create-your-user"
    });
  } catch (error) {
    console.error("Create user 1 error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Create user 1 failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 