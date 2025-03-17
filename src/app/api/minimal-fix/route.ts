import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Starting minimal schema fix...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '3000'");
    
    // Check if users table exists and has name column
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
        message: "Created users table",
        next: "/api/minimal-fix?step=2"
      });
    }
    
    // Check if we need to add name column
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
    }
    
    // Get the step parameter
    const url = new URL(request.url);
    const step = url.searchParams.get('step') || '1';
    
    if (step === '1') {
      return NextResponse.json({
        success: true,
        message: "Checked users table",
        next: "/api/minimal-fix?step=2"
      });
    }
    
    if (step === '2') {
      // Check products table
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
            user_id INTEGER REFERENCES users(id),
            barcode VARCHAR(255),
            name VARCHAR(255) NOT NULL,
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
      } else {
        // Check if name column exists
        const nameColumnExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'name'
          )
        `);
        
        if (!nameColumnExists.rows[0].exists) {
          console.log("Name column doesn't exist in products table, adding it");
          await pool.query(`ALTER TABLE products ADD COLUMN name VARCHAR(255)`);
          await pool.query(`UPDATE products SET name = 'Product ' || id WHERE name IS NULL`);
          console.log("Added name column to products table");
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Checked products table",
        next: "/api/minimal-fix?step=3"
      });
    }
    
    if (step === '3') {
      // Check expiry_items table
      const expiryTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'expiry_items'
        )
      `);
      
      if (!expiryTableExists.rows[0].exists) {
        console.log("Expiry_items table doesn't exist, creating it");
        await pool.query(`
          CREATE TABLE expiry_items (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            barcode VARCHAR(255),
            item_name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2),
            weight VARCHAR(255),
            category VARCHAR(255),
            image_url TEXT,
            quantity INTEGER DEFAULT 1,
            expiry_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP
          )
        `);
        console.log("Created expiry_items table");
      } else {
        // Check if item_name column exists
        const itemNameColumnExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'expiry_items' AND column_name = 'item_name'
          )
        `);
        
        if (!itemNameColumnExists.rows[0].exists) {
          console.log("Item_name column doesn't exist in expiry_items table, adding it");
          await pool.query(`ALTER TABLE expiry_items ADD COLUMN item_name VARCHAR(255)`);
          await pool.query(`UPDATE expiry_items SET item_name = 'Item ' || id WHERE item_name IS NULL`);
          console.log("Added item_name column to expiry_items table");
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Database schema fixed successfully",
        complete: true
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Invalid step parameter",
      next: "/api/minimal-fix?step=1"
    });
  } catch (error) {
    console.error("Minimal schema fix error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Minimal schema fix failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 