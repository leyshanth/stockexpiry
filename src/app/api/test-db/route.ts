import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test basic connection
    console.log("Testing database connection...");
    const connectionTest = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", connectionTest.rows[0]);
    
    // Test tables
    console.log("Checking database tables...");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log("Available tables:", tables);
    
    // Test user table
    let userTableExists = tables.includes('users');
    console.log("Users table exists:", userTableExists);
    
    // Test expiry_items table
    let expiryTableExists = tables.includes('expiry_items');
    console.log("Expiry items table exists:", expiryTableExists);
    
    // Test products table
    let productsTableExists = tables.includes('products');
    console.log("Products table exists:", productsTableExists);
    
    // Create missing tables if needed
    if (!userTableExists) {
      console.log("Creating users table...");
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
      console.log("Users table created");
    }
    
    if (!expiryTableExists) {
      console.log("Creating expiry_items table...");
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
      console.log("Expiry items table created");
    }
    
    if (!productsTableExists) {
      console.log("Creating products table...");
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
      console.log("Products table created");
    }
    
    // Check if tables were created successfully
    const tablesAfterResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tablesAfter = tablesAfterResult.rows.map(row => row.table_name);
    
    return NextResponse.json({
      success: true,
      connection: "Connected to database",
      timestamp: connectionTest.rows[0].now,
      tablesBefore: tables,
      tablesAfter: tablesAfter,
      userTableExists: tables.includes('users'),
      expiryTableExists: tables.includes('expiry_items'),
      productsTableExists: tables.includes('products'),
      userTableCreated: !userTableExists && tablesAfter.includes('users'),
      expiryTableCreated: !expiryTableExists && tablesAfter.includes('expiry_items'),
      productsTableCreated: !productsTableExists && tablesAfter.includes('products')
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database connection failed", 
        details: error instanceof Error ? error.message : String(error),
        connectionString: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') // Hide password
      },
      { status: 500 }
    );
  }
} 