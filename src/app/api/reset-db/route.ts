import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Starting database reset...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Check connection
    const connectionTest = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", connectionTest.rows[0].now);
    
    // Drop and recreate products table
    await pool.query(`DROP TABLE IF EXISTS products`);
    
    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        barcode VARCHAR(255),
        name VARCHAR(255),
        price DECIMAL(10, 2),
        weight VARCHAR(255),
        category VARCHAR(255),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);
    
    console.log("Products table reset successfully");
    
    // Check if users table exists
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!usersTableExists.rows[0].exists) {
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
      
      // Create a test user with ID 1
      const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
      await pool.query(`
        INSERT INTO users (id, name, email, password)
        VALUES (1, 'Default User', 'default@example.com', $1)
      `, [hashedPassword]);
      
      console.log("Users table created with default user");
    }
    
    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
      timestamp: connectionTest.rows[0].now
    });
  } catch (error) {
    console.error("Database reset error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database reset failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 