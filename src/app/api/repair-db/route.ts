import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting database repair...");
    
    // Drop and recreate tables
    console.log("Dropping existing tables...");
    
    // Drop tables in the correct order to avoid foreign key constraints
    await pool.query(`
      DROP TABLE IF EXISTS expiry_items;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS users;
    `);
    
    console.log("Creating users table...");
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
    
    console.log("Creating expiry_items table...");
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
    
    console.log("Creating products table...");
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
    
    // Create a test user
    console.log("Creating test user...");
    const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
    
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password)
      VALUES ('Test User', 'test@example.com', $1)
      RETURNING id
    `, [hashedPassword]);
    
    const userId = userResult.rows[0].id;
    
    // Create test data
    console.log("Creating test data...");
    
    // Add test expiry items
    await pool.query(`
      INSERT INTO expiry_items (user_id, item_name, expiry_date)
      VALUES 
        ($1, 'Test Item 1', NOW() + INTERVAL '7 days'),
        ($1, 'Test Item 2', NOW() + INTERVAL '14 days'),
        ($1, 'Test Item 3', NOW() + INTERVAL '21 days')
    `, [userId]);
    
    // Add test products
    await pool.query(`
      INSERT INTO products (user_id, name, price)
      VALUES 
        ($1, 'Test Product 1', 9.99),
        ($1, 'Test Product 2', 19.99),
        ($1, 'Test Product 3', 29.99)
    `, [userId]);
    
    console.log("Database repair completed successfully");
    
    return NextResponse.json({
      success: true,
      message: "Database repaired successfully",
      testUser: {
        email: "test@example.com",
        password: "password123"
      }
    });
  } catch (error) {
    console.error("Database repair error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database repair failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 