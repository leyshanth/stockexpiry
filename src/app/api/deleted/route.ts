import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import pool from "@/lib/db";

// Get all deleted items for the logged-in user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    
    try {
      // Get deleted products
      const productsResult = await client.query(
        `SELECT id, barcode, item_name, price, NULL as quantity, NULL as expiry_date, deleted_at, 'product' as type
         FROM deleted_products
         WHERE user_id = $1`,
        [session.user.id]
      );
      
      // Get deleted expiry items
      const expiryResult = await client.query(
        `SELECT id, barcode, item_name, price, quantity, expiry_date, deleted_at, 'expiry' as type
         FROM deleted_expiry_items
         WHERE user_id = $1`,
        [session.user.id]
      );
      
      // Combine and sort by deletion date (newest first)
      const deletedItems = [
        ...productsResult.rows,
        ...expiryResult.rows
      ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      
      return NextResponse.json(deletedItems);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching deleted items:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted items" },
      { status: 500 }
    );
  }
} 