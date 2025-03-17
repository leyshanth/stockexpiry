import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Get all products for the logged-in user
export async function GET() {
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
    
    // Get products for the user
    const result = await pool.query(
      `SELECT * FROM products WHERE user_id = $1`,
      [userId]
    );
    
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

// Create a new product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { barcode, item_name, price, weight, category, image_url } = await request.json();

    const result = await pool.query(
      `INSERT INTO products 
       (user_id, barcode, item_name, price, weight, category, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [session.user.id, barcode, item_name, price, weight, category, image_url]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 