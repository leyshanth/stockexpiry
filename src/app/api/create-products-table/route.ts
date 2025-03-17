import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Creating products table...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '1500'");
    
    // Check if products table exists
    const productsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      )
    `);
    
    if (productsTableExists.rows[0].exists) {
      // Drop the existing table
      await pool.query(`DROP TABLE products`);
      console.log("Dropped existing products table");
    }
    
    // Create products table
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
    
    console.log("Created products table");
    
    return NextResponse.json({
      success: true,
      message: "Created products table",
      next: "/api/check-users-table"
    });
  } catch (error) {
    console.error("Create products table error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Create products table failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 