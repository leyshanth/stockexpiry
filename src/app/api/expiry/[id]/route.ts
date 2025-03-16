import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

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
      await client.query('BEGIN');
      
      // Get the expiry item data before deleting
      const expiryResult = await client.query(
        "SELECT * FROM expiry_items WHERE id = $1 AND user_id = $2",
        [id, session.user.id]
      );
      
      if (expiryResult.rows.length === 0) {
        return NextResponse.json({ error: "Expiry item not found" }, { status: 404 });
      }
      
      const expiryItem = expiryResult.rows[0];
      
      // Move to deleted_expiry_items table
      await client.query(
        `INSERT INTO deleted_expiry_items 
         (id, user_id, barcode, item_name, price, weight, category, image_url, quantity, expiry_date)
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
      
      // Delete from expiry_items table
      await client.query(
        "DELETE FROM expiry_items WHERE id = $1 AND user_id = $2",
        [id, session.user.id]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({ message: "Expiry item deleted successfully" });
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