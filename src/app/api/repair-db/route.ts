import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting database repair...");
    
    // First, check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log("Existing tables:", existingTables);
    
    // Check for foreign key constraints
    const constraintsResult = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);
    
    console.log("Foreign key constraints:", constraintsResult.rows);
    
    // Disable triggers temporarily to avoid issues with constraints
    await pool.query("SET session_replication_role = 'replica';");
    
    // Truncate all tables instead of dropping them
    console.log("Truncating existing tables...");
    
    // First truncate tables with foreign keys
    if (existingTables.includes('expiry_items')) {
      await pool.query("TRUNCATE TABLE expiry_items CASCADE;");
      console.log("Truncated expiry_items table");
    }
    
    if (existingTables.includes('products')) {
      await pool.query("TRUNCATE TABLE products CASCADE;");
      console.log("Truncated products table");
    }
    
    if (existingTables.includes('deleted_expiry_items')) {
      await pool.query("TRUNCATE TABLE deleted_expiry_items CASCADE;");
      console.log("Truncated deleted_expiry_items table");
    }
    
    if (existingTables.includes('deleted_products')) {
      await pool.query("TRUNCATE TABLE deleted_products CASCADE;");
      console.log("Truncated deleted_products table");
    }
    
    if (existingTables.includes('expiry')) {
      await pool.query("TRUNCATE TABLE expiry CASCADE;");
      console.log("Truncated expiry table");
    }
    
    if (existingTables.includes('deleted_expiry')) {
      await pool.query("TRUNCATE TABLE deleted_expiry CASCADE;");
      console.log("Truncated deleted_expiry table");
    }
    
    // Then truncate the users table
    if (existingTables.includes('users')) {
      await pool.query("TRUNCATE TABLE users CASCADE;");
      console.log("Truncated users table");
    }
    
    // Re-enable triggers
    await pool.query("SET session_replication_role = 'origin';");
    
    // Create or update tables as needed
    console.log("Updating table schemas...");
    
    // Create or update users table
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
    console.log("Users table schema updated");
    
    // Create or update expiry_items table
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
    console.log("Expiry items table schema updated");
    
    // Create or update products table
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
    console.log("Products table schema updated");
    
    // Create a test user
    console.log("Creating test user...");
    const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
    
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password)
      VALUES ('Test User', 'test@example.com', $1)
      RETURNING id
    `, [hashedPassword]);
    
    const userId = userResult.rows[0].id;
    console.log("Created test user with ID:", userId);
    
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
    console.log("Created test expiry items");
    
    // Add test products
    await pool.query(`
      INSERT INTO products (user_id, name, price)
      VALUES 
        ($1, 'Test Product 1', 9.99),
        ($1, 'Test Product 2', 19.99),
        ($1, 'Test Product 3', 29.99)
    `, [userId]);
    console.log("Created test products");
    
    // Also create a record for the current user if they exist
    const currentUserEmail = 'leyshanth.1177@gmail.com'; // Replace with the actual email
    
    // Check if this user already exists in the database
    const existingUserResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [currentUserEmail]
    );
    
    let currentUserId;
    
    if (existingUserResult.rows.length === 0) {
      // Create a new user record
      const currentUserResult = await pool.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Current User', $1, $2)
        RETURNING id
      `, [currentUserEmail, hashedPassword]);
      
      currentUserId = currentUserResult.rows[0].id;
      console.log("Created current user with ID:", currentUserId);
    } else {
      currentUserId = existingUserResult.rows[0].id;
      console.log("Found existing current user with ID:", currentUserId);
    }
    
    // Add test data for the current user
    await pool.query(`
      INSERT INTO expiry_items (user_id, item_name, expiry_date)
      VALUES 
        ($1, 'My Item 1', NOW() + INTERVAL '3 days'),
        ($1, 'My Item 2', NOW() + INTERVAL '10 days')
    `, [currentUserId]);
    
    await pool.query(`
      INSERT INTO products (user_id, name, price)
      VALUES 
        ($1, 'My Product 1', 14.99),
        ($1, 'My Product 2', 24.99)
    `, [currentUserId]);
    
    console.log("Created test data for current user");
    
    console.log("Database repair completed successfully");
    
    return NextResponse.json({
      success: true,
      message: "Database repaired successfully",
      testUser: {
        email: "test@example.com",
        password: "password123"
      },
      currentUser: {
        email: currentUserEmail,
        id: currentUserId
      },
      tablesRepaired: [
        "users",
        "expiry_items",
        "products"
      ]
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