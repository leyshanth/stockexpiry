import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Get all products
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get products from database
    const result = await pool.query(
      "SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    
    console.log(`Found ${result.rows.length} products`);
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Create a new product
export async function POST(request: Request) {
  try {
    console.log("Creating new product");
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user?.id;
    
    if (!userId) {
      console.log("No user ID in session");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    
    // Convert to numeric user ID
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    console.log(`Creating product for user ID: ${numericUserId}`);

    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const { barcode, name, price, weight, category, image_url } = body;

    // Check if the products table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products')"
    );
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log("Creating products table");
      // Create the products table if it doesn't exist
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

    // Insert the product
    const result = await pool.query(
      `INSERT INTO products 
       (user_id, barcode, name, price, weight, category, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [numericUserId, barcode, name, price, weight, category, image_url]
    );

    console.log("Product created:", result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 