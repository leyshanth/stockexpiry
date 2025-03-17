import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test basic connection
    console.log("Testing database connection...");
    const connectionTest = await pool.query("SELECT NOW()");
    
    // Check table structure
    const usersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const userColumnNames = usersColumns.rows.map(row => row.column_name);
    console.log("User table columns:", userColumnNames);
    
    // Get current user info with dynamic column selection
    const email = 'leyshanth.1177@gmail.com';
    let userResult;
    
    if (userColumnNames.includes('name')) {
      userResult = await pool.query(
        "SELECT id, name, email FROM users WHERE email = $1",
        [email]
      );
    } else {
      userResult = await pool.query(
        "SELECT id, email FROM users WHERE email = $1",
        [email]
      );
    }
    
    const user = userResult.rows.length > 0 ? userResult.rows[0] : null;
    
    // Check if tables exist before querying them
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    let expiryCount = { count: '0' };
    let productsCount = { count: '0' };
    let expiryItems = [];
    let products = [];
    
    if (tables.includes('expiry_items')) {
      const expiryCountResult = await pool.query("SELECT COUNT(*) FROM expiry_items");
      expiryCount = expiryCountResult.rows[0];
      
      const expiryItemsResult = await pool.query(
        "SELECT id, item_name, expiry_date FROM expiry_items LIMIT 3"
      );
      expiryItems = expiryItemsResult.rows;
    }
    
    if (tables.includes('products')) {
      const productsCountResult = await pool.query("SELECT COUNT(*) FROM products");
      productsCount = productsCountResult.rows[0];
      
      const productsResult = await pool.query(
        "SELECT id, name, price FROM products LIMIT 3"
      );
      products = productsResult.rows;
    }
    
    return NextResponse.json({
      success: true,
      connection: "Connected to database",
      timestamp: connectionTest.rows[0].now,
      tables: tables,
      userColumns: userColumnNames,
      user: user,
      counts: {
        expiryItems: parseInt(expiryCount.count),
        products: parseInt(productsCount.count)
      },
      samples: {
        expiryItems: expiryItems,
        products: products
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