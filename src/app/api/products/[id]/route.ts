import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// Get a specific product
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
      "SELECT * FROM products WHERE id = $1 AND user_id = $2",
      [params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// Update a product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { barcode, item_name, price, weight, category, image_url } = await request.json();

    const result = await pool.query(
      `UPDATE products 
       SET barcode = $1, item_name = $2, price = $3, weight = $4, category = $5, image_url = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [barcode, item_name, price, weight, category, image_url, params.id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// Delete a product
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
      
      // Get the product data before deleting
      const productResult = await client.query(
        "SELECT * FROM products WHERE id = $1 AND user_id = $2",
        [id, session.user.id]
      );
      
      if (productResult.rows.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      
      const product = productResult.rows[0];
      
      // Move to deleted_products table
      await client.query(
        `INSERT INTO deleted_products 
         (id, user_id, barcode, item_name, price, weight, category, image_url)
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
      
      // Delete from products table
      await client.query(
        "DELETE FROM products WHERE id = $1 AND user_id = $2",
        [id, session.user.id]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 