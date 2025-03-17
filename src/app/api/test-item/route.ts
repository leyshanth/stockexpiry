import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // First, check if the table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expiry_items')"
    );
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      return NextResponse.json({ 
        success: false, 
        message: "expiry_items table does not exist" 
      });
    }
    
    // Create a test item
    const result = await pool.query(
      `INSERT INTO expiry_items 
       (user_id, item_name, expiry_date) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [1, "Test Item", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Test item created successfully", 
      item: result.rows[0] 
    });
  } catch (error) {
    console.error("Error creating test item:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create test item", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 