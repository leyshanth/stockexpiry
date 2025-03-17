import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log("Checking database tables...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '1500'");
    
    // Check connection
    const connectionTest = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", connectionTest.rows[0].now);
    
    // Check which tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log("Existing tables:", tables);
    
    return NextResponse.json({
      success: true,
      connection: "Connected to database",
      timestamp: connectionTest.rows[0].now,
      tables: tables,
      productsTableExists: tables.includes('products'),
      usersTableExists: tables.includes('users'),
      expiryItemsTableExists: tables.includes('expiry_items')
    });
  } catch (error) {
    console.error("Table check error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Table check failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 