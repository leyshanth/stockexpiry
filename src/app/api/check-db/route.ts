import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Checking database...");
    
    // Set a shorter statement timeout for this connection
    await pool.query("SET statement_timeout = '2000'");
    
    // Check connection
    const connectionTest = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", connectionTest.rows[0].now);
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableNames = tables.rows.map(row => row.table_name);
    console.log("Tables:", tableNames);
    
    // Check users table
    let userColumns = [];
    if (tableNames.includes('users')) {
      const userColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      userColumns = userColumnsResult.rows.map(row => row.column_name);
    }
    
    // Check products table
    let productColumns = [];
    if (tableNames.includes('products')) {
      const productColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products'
      `);
      productColumns = productColumnsResult.rows.map(row => row.column_name);
    }
    
    // Check expiry_items table
    let expiryColumns = [];
    if (tableNames.includes('expiry_items')) {
      const expiryColumnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'expiry_items'
      `);
      expiryColumns = expiryColumnsResult.rows.map(row => row.column_name);
    }
    
    return NextResponse.json({
      success: true,
      connection: "Connected to database",
      timestamp: connectionTest.rows[0].now,
      tables: tableNames,
      columns: {
        users: userColumns,
        products: productColumns,
        expiry_items: expiryColumns
      },
      issues: {
        usersTableMissing: !tableNames.includes('users'),
        productsTableMissing: !tableNames.includes('products'),
        expiryTableMissing: !tableNames.includes('expiry_items'),
        userNameColumnMissing: tableNames.includes('users') && !userColumns.includes('name'),
        productNameColumnMissing: tableNames.includes('products') && !productColumns.includes('name'),
        expiryItemNameColumnMissing: tableNames.includes('expiry_items') && !expiryColumns.includes('item_name')
      }
    });
  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database check failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 