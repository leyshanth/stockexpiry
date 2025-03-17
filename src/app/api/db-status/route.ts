import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test basic connection
    console.log("Testing database connection...");
    const connectionTest = await pool.query("SELECT NOW()");
    
    // Get current user info
    const email = 'leyshanth.1177@gmail.com';
    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [email]
    );
    
    const user = userResult.rows.length > 0 ? userResult.rows[0] : null;
    
    // Count items in tables
    const expiryCount = await pool.query("SELECT COUNT(*) FROM expiry_items");
    const productsCount = await pool.query("SELECT COUNT(*) FROM products");
    
    // Get a sample of items
    const expiryItems = await pool.query(
      "SELECT id, item_name, expiry_date FROM expiry_items LIMIT 3"
    );
    
    const products = await pool.query(
      "SELECT id, name, price FROM products LIMIT 3"
    );
    
    return NextResponse.json({
      success: true,
      connection: "Connected to database",
      timestamp: connectionTest.rows[0].now,
      user: user,
      counts: {
        expiryItems: parseInt(expiryCount.rows[0].count),
        products: parseInt(productsCount.rows[0].count)
      },
      samples: {
        expiryItems: expiryItems.rows,
        products: products.rows
      }
    });
  } catch (error) {
    console.error("Database status error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database status check failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 