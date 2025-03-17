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
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Session user:", session.user);
    
    // Get the user ID from the session
    const userId = session.user?.id;
    
    if (!userId) {
      console.log("No user ID in session");
      
      // Try to get the user ID from the email as a fallback
      if (session.user?.email) {
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [session.user.email]
        );
        
        if (userResult.rows.length > 0) {
          const fetchedUserId = userResult.rows[0].id;
          console.log(`Found user ID ${fetchedUserId} from email ${session.user.email}`);
          
          // Get expiry items using the fetched user ID
          const result = await pool.query(
            "SELECT * FROM expiry_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY expiry_date ASC",
            [fetchedUserId]
          );
          
          console.log(`Found ${result.rows.length} expiry items for user ${fetchedUserId}`);
          return NextResponse.json({ items: result.rows });
        }
      }
      
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    
    // Get expiry items from database for this specific user
    const result = await pool.query(
      "SELECT * FROM expiry_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY expiry_date ASC",
      [userId]
    );
    
    console.log(`Found ${result.rows.length} expiry items for user ${userId}`);
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching expiry items:", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry items", details: error instanceof Error ? error.message : String(error) },
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