import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Fixing products table...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Check if products table exists
    const productsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      )
    `);
    
    if (!productsTableExists.rows[0].exists) {
      console.log("Products table doesn't exist, creating it");
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
        message: "Created products table"
      });
    }
    
    // Get the columns in the products table
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log("Products table columns:", columns);
    
    // Check if name column exists
    if (!columns.includes('name')) {
      console.log("Adding name column to products table");
      await pool.query(`ALTER TABLE products ADD COLUMN name VARCHAR(255)`);
      
      // Update existing products with a default name
      await pool.query(`
        UPDATE products 
        SET name = 'Product ' || id 
        WHERE name IS NULL OR name = ''
      `);
      
      return NextResponse.json({
        success: true,
        message: "Added name column to products table"
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Products table is already set up correctly"
    });
  } catch (error) {
    console.error("Fix products table error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Fix products table failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 