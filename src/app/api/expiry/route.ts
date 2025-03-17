import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Get all expiry items for the logged-in user
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get expiry items from database
    const result = await pool.query(
      "SELECT * FROM expiry_items WHERE deleted_at IS NULL ORDER BY expiry_date ASC"
    );
    
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching expiry items:", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry items" },
      { status: 500 }
    );
  }
}

// Create a new expiry item
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { barcode, item_name, price, weight, category, image_url, quantity, expiry_date } = await request.json();

    const result = await pool.query(
      `INSERT INTO expiry_items 
       (user_id, barcode, item_name, price, weight, category, image_url, quantity, expiry_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, barcode, item_name, price, weight, category, image_url, quantity, expiry_date]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating expiry item:", error);
    return NextResponse.json(
      { error: "Failed to create expiry item" },
      { status: 500 }
    );
  }
} 