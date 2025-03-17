import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting schema fix...");
    
    // Check existing tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log("Existing tables:", tables);
    
    // Check users table columns
    let usersColumns = [];
    if (tables.includes('users')) {
      const usersColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      usersColumns = usersColumnsResult.rows.map(row => row.column_name);
      console.log("Users table columns:", usersColumns);
      
      // Add missing columns to users table
      if (!usersColumns.includes('name')) {
        await pool.query(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
        console.log("Added name column to users table");
      }
      
      // Update any NULL name values
      await pool.query(`
        UPDATE users 
        SET name = 'User ' || id 
        WHERE name IS NULL OR name = ''
      `);
      console.log("Updated NULL name values in users table");
    }
    
    // Check expiry_items table
    if (tables.includes('expiry_items')) {
      const expiryColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'expiry_items'
      `);
      const expiryColumns = expiryColumnsResult.rows.map(row => row.column_name);
      console.log("Expiry items table columns:", expiryColumns);
      
      // Add missing columns to expiry_items table
      if (!expiryColumns.includes('item_name')) {
        await pool.query(`ALTER TABLE expiry_items ADD COLUMN item_name VARCHAR(255)`);
        console.log("Added item_name column to expiry_items table");
        
        // Update any NULL item_name values
        await pool.query(`
          UPDATE expiry_items 
          SET item_name = 'Item ' || id 
          WHERE item_name IS NULL OR item_name = ''
        `);
      }
    }
    
    // Check products table
    if (tables.includes('products')) {
      const productsColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products'
      `);
      const productsColumns = productsColumnsResult.rows.map(row => row.column_name);
      console.log("Products table columns:", productsColumns);
      
      // Add missing columns to products table
      if (!productsColumns.includes('name')) {
        await pool.query(`ALTER TABLE products ADD COLUMN name VARCHAR(255)`);
        console.log("Added name column to products table");
        
        // Update any NULL name values
        await pool.query(`
          UPDATE products 
          SET name = 'Product ' || id 
          WHERE name IS NULL OR name = ''
        `);
      }
    }
    
    // Create essential tables if they don't exist
    if (!tables.includes('users')) {
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
      console.log("Created users table");
    }
    
    if (!tables.includes('expiry_items')) {
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
    }
    
    if (!tables.includes('products')) {
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
    }
    
    // Create a test user if none exists
    const userCountResult = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCountResult.rows[0].count) === 0) {
      const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
      
      await pool.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Test User', 'test@example.com', $1)
      `, [hashedPassword]);
      
      console.log("Created test user");
    }
    
    console.log("Schema fix completed successfully");
    
    return NextResponse.json({
      success: true,
      message: "Schema fix completed successfully",
      tablesFixed: tables,
      usersColumnsFixed: usersColumns
    });
  } catch (error) {
    console.error("Schema fix error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Schema fix failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 