import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// Get a product by barcode
export async function GET(
  request: Request,
  { params }: { params: { barcode: string } }
) {
  try {
    console.log("API: Looking up product with barcode:", params.barcode);
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("API: Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1 AND user_id = $2",
      [params.barcode, session.user.id]
    );

    console.log("API: Query result rows:", result.rows.length);

    if (result.rows.length === 0) {
      console.log("API: Product not found");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("API: Product found:", result.rows[0].item_name);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
} 