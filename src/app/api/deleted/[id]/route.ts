import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (type === 'product') {
        // Get the product data
        const productResult = await client.query(
          `SELECT * FROM deleted_products WHERE id = $1 AND user_id = $2`,
          [id, session.user.id]
        );
        
        if (productResult.rows.length === 0) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        
        const product = productResult.rows[0];
        
        // Restore the product
        await client.query(
          `INSERT INTO products (id, user_id, barcode, item_name, price, weight, category, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            product.id,
            session.user.id,
            product.barcode,
            product.item_name,
            product.price,
            product.weight,
            product.category,
            product.image_url
          ]
        );
        
        // Delete from deleted_products
        await client.query(
          `DELETE FROM deleted_products WHERE id = $1 AND user_id = $2`,
          [id, session.user.id]
        );
      } else if (type === 'expiry') {
        // Get the expiry item data
        const expiryResult = await client.query(
          `SELECT * FROM deleted_expiry_items WHERE id = $1 AND user_id = $2`,
          [id, session.user.id]
        );
        
        if (expiryResult.rows.length === 0) {
          return NextResponse.json({ error: "Expiry item not found" }, { status: 404 });
        }
        
        const expiryItem = expiryResult.rows[0];
        
        // Restore the expiry item
        await client.query(
          `INSERT INTO expiry_items (id, user_id, barcode, item_name, price, weight, category, image_url, quantity, expiry_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            expiryItem.id,
            session.user.id,
            expiryItem.barcode,
            expiryItem.item_name,
            expiryItem.price,
            expiryItem.weight,
            expiryItem.category,
            expiryItem.image_url,
            expiryItem.quantity,
            expiryItem.expiry_date
          ]
        );
        
        // Delete from deleted_expiry_items
        await client.query(
          `DELETE FROM deleted_expiry_items WHERE id = $1 AND user_id = $2`,
          [id, session.user.id]
        );
      } else {
        return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({ message: "Item restored successfully" });
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Try to delete from both tables
      await client.query(
        `DELETE FROM deleted_products WHERE id = $1 AND user_id = $2`,
        [id, session.user.id]
      );
      
      await client.query(
        `DELETE FROM deleted_expiry_items WHERE id = $1 AND user_id = $2`,
        [id, session.user.id]
      );
      
      return NextResponse.json({ message: "Item permanently deleted" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error permanently deleting item:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete item" },
      { status: 500 }
    );
  }
} 