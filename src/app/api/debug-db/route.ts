import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check expiry_items table structure
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'expiry_items'
      ORDER BY ordinal_position
    `);
    
    // Get a sample row
    const sampleRow = await pool.query(`
      SELECT * FROM expiry_items LIMIT 1
    `);
    
    // Check user_id values
    const userIds = await pool.query(`
      SELECT DISTINCT user_id FROM expiry_items
    `);
    
    // Check if there are any items for user ID 1
    const userItems = await pool.query(`
      SELECT COUNT(*) FROM expiry_items WHERE user_id = 1
    `);
    
    return NextResponse.json({
      tableStructure: tableStructure.rows,
      sampleRow: sampleRow.rows.length > 0 ? sampleRow.rows[0] : null,
      userIds: userIds.rows.map(row => row.user_id),
      userItemsCount: userItems.rows[0].count
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json(
      { error: "Database debug failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 