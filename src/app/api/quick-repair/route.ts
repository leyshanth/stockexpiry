import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting quick database repair...");
    
    // Focus only on the essential tables
    const essentialTables = ['users', 'expiry_items', 'products'];
    
    // Disable triggers temporarily
    await pool.query("SET session_replication_role = 'replica';");
    
    // Truncate only the essential tables
    for (const table of essentialTables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} CASCADE;`);
        console.log(`Truncated ${table} table`);
      } catch (err) {
        console.log(`Table ${table} might not exist, will create it`);
      }
    }
    
    // Re-enable triggers
    await pool.query("SET session_replication_role = 'origin';");
    
    // Create or update essential tables
    console.log("Creating essential tables...");
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create expiry_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expiry_items (
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
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
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
    
    // Create a test user and your user
    console.log("Creating users...");
    const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
    
    // Create your user
    const yourEmail = 'leyshanth.1177@gmail.com';
    
    const yourUserResult = await pool.query(`
      INSERT INTO users (name, email, password)
      VALUES ('Your Name', $1, $2)
      RETURNING id
    `, [yourEmail, hashedPassword]);
    
    const yourUserId = yourUserResult.rows[0].id;
    
    // Add minimal test data for your user
    await pool.query(`
      INSERT INTO expiry_items (user_id, item_name, expiry_date)
      VALUES ($1, 'Test Expiry Item', NOW() + INTERVAL '7 days')
    `, [yourUserId]);
    
    await pool.query(`
      INSERT INTO products (user_id, name, price)
      VALUES ($1, 'Test Product', 9.99)
    `, [yourUserId]);
    
    console.log("Quick database repair completed successfully");
    
    return NextResponse.json({
      success: true,
      message: "Database quick repair successful",
      yourUser: {
        id: yourUserId,
        email: yourEmail
      }
    });
  } catch (error) {
    console.error("Quick database repair error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Quick database repair failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 