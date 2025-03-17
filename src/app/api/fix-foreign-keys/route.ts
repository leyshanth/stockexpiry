import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Fixing foreign key constraints...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '3000'");
    
    // Check if users table exists
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!usersTableExists.rows[0].exists) {
      console.log("Users table doesn't exist, creating it");
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
        VALUES (1, 'Test User', 'test@example.com', $1)
      `, [hashedPassword]);
      
      // Create your user
      await pool.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Your Name', 'leyshanth.1177@gmail.com', $1)
      `, [hashedPassword]);
      
      console.log("Created users table with test users");
      
      return NextResponse.json({
        success: true,
        message: "Created users table with test users"
      });
    }
    
    // Check if user with ID 1 exists
    const userOneExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE id = 1
      )
    `);
    
    if (!userOneExists.rows[0].exists) {
      console.log("User with ID 1 doesn't exist, creating it");
      
      // Create a test user with ID 1
      const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
      
      // Check if the sequence is already past 1
      const maxIdResult = await pool.query(`SELECT MAX(id) FROM users`);
      const maxId = maxIdResult.rows[0].max || 0;
      
      if (maxId > 1) {
        // We need to temporarily disable the foreign key constraints
        await pool.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_user_id_fkey`);
        await pool.query(`ALTER TABLE expiry_items DROP CONSTRAINT IF EXISTS expiry_items_user_id_fkey`);
        
        // Insert user with ID 1
        await pool.query(`
          INSERT INTO users (id, name, email, password)
          VALUES (1, 'Test User', 'test1@example.com', $1)
        `, [hashedPassword]);
        
        // Re-enable foreign key constraints
        await pool.query(`
          ALTER TABLE products 
          ADD CONSTRAINT products_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id)
        `);
        
        await pool.query(`
          ALTER TABLE expiry_items 
          ADD CONSTRAINT expiry_items_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id)
        `);
      } else {
        // We can just insert the user with ID 1
        await pool.query(`
          INSERT INTO users (id, name, email, password)
          VALUES (1, 'Test User', 'test1@example.com', $1)
        `, [hashedPassword]);
      }
      
      console.log("Created user with ID 1");
    }
    
    // Check if your user exists
    const yourUserExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE email = 'leyshanth.1177@gmail.com'
      )
    `);
    
    if (!yourUserExists.rows[0].exists) {
      console.log("Your user doesn't exist, creating it");
      
      // Create your user
      const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'; // 'password123'
      await pool.query(`
        INSERT INTO users (name, email, password)
        VALUES ('Your Name', 'leyshanth.1177@gmail.com', $1)
      `, [hashedPassword]);
      
      console.log("Created your user");
    }
    
    // Get your user ID
    const yourUserResult = await pool.query(`
      SELECT id FROM users 
      WHERE email = 'leyshanth.1177@gmail.com'
    `);
    
    const yourUserId = yourUserResult.rows[0]?.id;
    
    // Check for products with invalid user IDs
    const invalidProductsResult = await pool.query(`
      SELECT p.id, p.user_id 
      FROM products p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    const invalidProducts = invalidProductsResult.rows;
    
    if (invalidProducts.length > 0 && yourUserId) {
      console.log(`Found ${invalidProducts.length} products with invalid user IDs, fixing them`);
      
      // Update products with invalid user IDs to use your user ID
      await pool.query(`
        UPDATE products 
        SET user_id = $1 
        WHERE id IN (${invalidProducts.map(p => p.id).join(',')})
      `, [yourUserId]);
      
      console.log("Fixed products with invalid user IDs");
    }
    
    // Check for expiry items with invalid user IDs
    const invalidExpiryItemsResult = await pool.query(`
      SELECT e.id, e.user_id 
      FROM expiry_items e 
      LEFT JOIN users u ON e.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    const invalidExpiryItems = invalidExpiryItemsResult.rows;
    
    if (invalidExpiryItems.length > 0 && yourUserId) {
      console.log(`Found ${invalidExpiryItems.length} expiry items with invalid user IDs, fixing them`);
      
      // Update expiry items with invalid user IDs to use your user ID
      await pool.query(`
        UPDATE expiry_items 
        SET user_id = $1 
        WHERE id IN (${invalidExpiryItems.map(e => e.id).join(',')})
      `, [yourUserId]);
      
      console.log("Fixed expiry items with invalid user IDs");
    }
    
    return NextResponse.json({
      success: true,
      message: "Fixed foreign key constraints",
      yourUserId: yourUserId,
      invalidProducts: invalidProducts,
      invalidExpiryItems: invalidExpiryItems
    });
  } catch (error) {
    console.error("Fix foreign keys error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Fix foreign keys failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 