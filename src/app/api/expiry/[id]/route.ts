import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";

// Get a specific expiry item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      "SELECT * FROM expiry WHERE id = $1 AND user_id = $2",
      [params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Expiry item not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching expiry item:", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry item" },
      { status: 500 }
    );
  }
}

// Update an expiry item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { barcode, item_name, price, weight, category, image_url, quantity, expiry_date } = await request.json();

    const result = await pool.query(
      `UPDATE expiry 
       SET barcode = $1, item_name = $2, price = $3, weight = $4, category = $5, 
           image_url = $6, quantity = $7, expiry_date = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [barcode, item_name, price, weight, category, image_url, quantity, expiry_date, params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Expiry item not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating expiry item:", error);
    return NextResponse.json(
      { error: "Failed to update expiry item" },
      { status: 500 }
    );
  }
}

// Delete an expiry item
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Extract user ID from session
    const sessionData = Buffer.from(sessionCookie.value, 'base64').toString();
    const userId = sessionData.split(':')[0];
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const id = params.id;
    
    // First, check if the item belongs to the user
    const checkResult = await pool.query(
      "SELECT * FROM expiry_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Item not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }
    
    // Get the item data before deleting
    const item = checkResult.rows[0];
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Move to deleted_items table
      await client.query(
        `INSERT INTO deleted_items 
         (user_id, barcode, item_name, price, weight, category, image_url, quantity, expiry_date, deleted_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          userId, 
          item.barcode, 
          item.item_name, 
          item.price, 
          item.weight, 
          item.category, 
          item.image_url, 
          item.quantity, 
          item.expiry_date
        ]
      );
      
      // Delete from expiry_items
      await client.query(
        "DELETE FROM expiry_items WHERE id = $1",
        [id]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting expiry item:", error);
    return NextResponse.json(
      { error: "Failed to delete expiry item" },
      { status: 500 }
    );
  }
} 