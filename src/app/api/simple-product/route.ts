import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Create a product with minimal operations
export async function POST(request: Request) {
  try {
    console.log("Starting simple product creation...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the user ID from the session
    const userId = session.user?.id || 1; // Default to user ID 1 if not found
    
    // Convert to numeric user ID
    let numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Get request body
    const body = await request.json();
    console.log("Creating product with data:", body);
    
    // Use a very simple insert query
    const query = `
      INSERT INTO products (user_id, barcode, name, price, weight, category, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, price
    `;
    
    const values = [
      numericUserId,
      body.barcode || null,
      body.name || body.item_name || 'Unnamed Product',
      body.price || null,
      body.weight || null,
      body.category || null,
      body.image_url || null
    ];
    
    const result = await pool.query(query, values);
    console.log("Product created:", result.rows[0]);
    
    return NextResponse.json({ 
      success: true,
      item: result.rows[0],
      message: "Product created successfully"
    });
  } catch (error) {
    console.error("Error creating product:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create product", 
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Try visiting /api/simple-db-check to diagnose database issues"
      },
      { status: 500 }
    );
  }
}

// Get all products with minimal operations
export async function GET() {
  try {
    console.log("Starting simple product retrieval...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the user ID from the session
    const userId = session.user?.id || 1; // Default to user ID 1 if not found
    
    // Convert to numeric user ID
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Use a simple query to get products
    const result = await pool.query(
      "SELECT id, name, price, barcode, category, image_url FROM products WHERE user_id = $1 LIMIT 20",
      [numericUserId]
    );
    
    console.log(`Found ${result.rows.length} products for user ${numericUserId}`);
    
    return NextResponse.json({ 
      success: true,
      items: result.rows 
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to retrieve products", 
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Try visiting /api/simple-db-check to diagnose database issues"
      },
      { status: 500 }
    );
  }
} 