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
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    
    const columns = columnsResult.rows;
    console.log("Products table columns:", columns);
    
    // Check for item_name column (which should be name)
    const hasItemName = columns.some(col => col.column_name === 'item_name');
    const hasName = columns.some(col => col.column_name === 'name');
    
    let changes = [];
    
    // If item_name exists but name doesn't, rename it
    if (hasItemName && !hasName) {
      console.log("Renaming item_name column to name");
      await pool.query(`ALTER TABLE products RENAME COLUMN item_name TO name`);
      changes.push("Renamed item_name to name");
    }
    
    // If both exist, copy data from item_name to name and drop item_name
    if (hasItemName && hasName) {
      console.log("Both item_name and name exist, copying data");
      await pool.query(`
        UPDATE products 
        SET name = item_name 
        WHERE name IS NULL AND item_name IS NOT NULL
      `);
      await pool.query(`ALTER TABLE products DROP COLUMN item_name`);
      changes.push("Copied data from item_name to name and dropped item_name");
    }
    
    // Make sure name column allows NULL values temporarily
    if (hasName) {
      const nameColumn = columns.find(col => col.column_name === 'name');
      if (nameColumn && nameColumn.is_nullable === 'NO') {
        console.log("Making name column nullable temporarily");
        await pool.query(`ALTER TABLE products ALTER COLUMN name DROP NOT NULL`);
        changes.push("Made name column nullable");
      }
    }
    
    // Check for user_id column and make sure it's properly set up
    const userIdColumn = columns.find(col => col.column_name === 'user_id');
    if (userIdColumn && userIdColumn.is_nullable === 'NO') {
      console.log("Making user_id column nullable");
      await pool.query(`ALTER TABLE products ALTER COLUMN user_id DROP NOT NULL`);
      changes.push("Made user_id column nullable");
    }
    
    return NextResponse.json({
      success: true,
      message: "Fixed products table schema",
      changes: changes,
      columns: columns
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