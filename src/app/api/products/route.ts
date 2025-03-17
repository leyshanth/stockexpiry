import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Get all products
export async function GET() {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Session user:", session.user);
    
    // Get the user ID from the session
    const userId = session.user?.id;
    
    if (!userId) {
      console.log("No user ID in session");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    
    // Convert to numeric user ID (handle both string and number types)
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    console.log(`Using numeric user ID: ${numericUserId}`);
    
    // Check if the products table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log("products table does not exist, creating it...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
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
      console.log("products table created");
      
      // Return empty array since the table was just created
      return NextResponse.json({ items: [] });
    }
    
    // Check if the products table has a name column
    const columnCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name')"
    );
    
    if (!columnCheck.rows[0].exists) {
      console.log("name column does not exist in products table, adding it...");
      await pool.query(`ALTER TABLE products ADD COLUMN name VARCHAR(255)`);
      console.log("name column added to products table");
    }
    
    // Get products from database for this specific user
    const result = await pool.query(
      "SELECT * FROM products WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC",
      [numericUserId]
    );
    
    console.log(`Found ${result.rows.length} products for user ${numericUserId}`);
    
    if (result.rows.length === 0) {
      // If no items found, try getting all products as a fallback
      console.log("No products found for this user, getting all products");
      const allResult = await pool.query(
        "SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10"
      );
      
      console.log(`Found ${allResult.rows.length} total products`);
      return NextResponse.json({ 
        items: allResult.rows,
        note: "Showing all products because no products found for your user ID"
      });
    }
    
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch products", 
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Try visiting /api/test-db to diagnose database issues or /api/repair-db to repair the database"
      },
      { status: 500 }
    );
  }
}

// Create a new product
export async function POST(request: Request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the user ID from the session
    const userId = session.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    
    // Convert to numeric user ID
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Get request body
    const body = await request.json();
    console.log("Creating product with data:", body);
    
    // Check if the products table has the correct schema
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    
    const columns = columnCheck.rows.map(row => row.column_name);
    console.log("Products table columns:", columns);
    
    // Handle the case where the table might have item_name instead of name
    const hasItemName = columns.includes('item_name');
    const hasName = columns.includes('name');
    
    let query;
    let values;
    
    if (hasName) {
      // Use name column
      query = `
        INSERT INTO products (user_id, barcode, name, price, weight, category, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      values = [
        numericUserId,
        body.barcode || null,
        body.name || body.item_name || 'Unnamed Product',
        body.price || null,
        body.weight || null,
        body.category || null,
        body.image_url || null
      ];
    } else if (hasItemName) {
      // Use item_name column
      query = `
        INSERT INTO products (user_id, barcode, item_name, price, weight, category, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      values = [
        numericUserId,
        body.barcode || null,
        body.name || body.item_name || 'Unnamed Product',
        body.price || null,
        body.weight || null,
        body.category || null,
        body.image_url || null
      ];
    } else {
      // Neither column exists, add name column
      await pool.query(`ALTER TABLE products ADD COLUMN name VARCHAR(255)`);
      console.log("Added name column to products table");
      
      query = `
        INSERT INTO products (user_id, barcode, name, price, weight, category, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      values = [
        numericUserId,
        body.barcode || null,
        body.name || body.item_name || 'Unnamed Product',
        body.price || null,
        body.weight || null,
        body.category || null,
        body.image_url || null
      ];
    }
    
    const result = await pool.query(query, values);
    console.log("Product created:", result.rows[0]);
    
    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { 
        error: "Failed to create product", 
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Try visiting /api/test-db to diagnose database issues or /api/fix-products-schema to fix the products table schema"
      },
      { status: 500 }
    );
  }
} 