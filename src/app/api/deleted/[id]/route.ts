import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Restore a deleted item
export async function POST(
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
    const { type } = await request.json();
    
    // First, check if the item belongs to the user
    const checkResult = await pool.query(
      "SELECT * FROM deleted_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Item not found or you don't have permission to restore it" },
        { status: 404 }
      );
    }
    
    // Get the item data
    const item = checkResult.rows[0];
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (type === 'product') {
        // Restore to products table
        await client.query(
          `INSERT INTO products 
           (user_id, barcode, item_name, price, weight, category, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId, 
            item.barcode, 
            item.item_name, 
            item.price, 
            item.weight, 
            item.category, 
            item.image_url
          ]
        );
      } else if (type === 'expiry') {
        // Restore to expiry_items table
        await client.query(
          `INSERT INTO expiry_items 
           (user_id, barcode, item_name, price, weight, category, image_url, quantity, expiry_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
      }
      
      // Delete from deleted_items
      await client.query(
        "DELETE FROM deleted_items WHERE id = $1",
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
    console.error("Error restoring item:", error);
    return NextResponse.json(
      { error: "Failed to restore item" },
      { status: 500 }
    );
  }
}

// Permanently delete an item
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
      "SELECT * FROM deleted_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Item not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }
    
    // Delete from deleted_items
    await pool.query(
      "DELETE FROM deleted_items WHERE id = $1",
      [id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error permanently deleting item:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete item" },
      { status: 500 }
    );
  }
} 