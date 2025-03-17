import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

// Get a product by barcode
export async function GET(
  request: Request,
  { params }: { params: { barcode: string } }
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

    const barcode = params.barcode;
    
    // Get product by barcode
    const result = await pool.query(
      `SELECT * FROM products WHERE user_id = $1 AND barcode = $2`,
      [userId, barcode]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
} 