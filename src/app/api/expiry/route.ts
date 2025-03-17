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
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    
    // Convert string ID to integer if needed
    const numericUserId = parseInt(userId, 10);
    console.log(`Using numeric user ID: ${numericUserId}`);
    
    try {
      // Get expiry items from database for this specific user
      const result = await pool.query(
        "SELECT * FROM expiry_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY expiry_date ASC",
        [numericUserId]
      );
      
      console.log(`Found ${result.rows.length} expiry items for user ${numericUserId}`);
      return NextResponse.json({ items: result.rows });
    } catch (dbError) {
      console.error("Database error:", dbError);
      
      // Try a fallback query without the user_id filter to see if the table exists
      try {
        const checkResult = await pool.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expiry_items')"
        );
        const tableExists = checkResult.rows[0].exists;
        
        if (!tableExists) {
          console.log("expiry_items table does not exist");
          return NextResponse.json({ 
            error: "Database table not found", 
            details: "The expiry_items table does not exist" 
          }, { status: 500 });
        }
        
        // Check if there are any items in the table
        const countResult = await pool.query("SELECT COUNT(*) FROM expiry_items");
        console.log(`Total expiry items in database: ${countResult.rows[0].count}`);
        
        return NextResponse.json({ 
          error: "Failed to fetch expiry items", 
          details: "Database error, but table exists",
          tableExists,
          totalItems: countResult.rows[0].count
        }, { status: 500 });
      } catch (fallbackError) {
        console.error("Fallback query error:", fallbackError);
        return NextResponse.json({ 
          error: "Failed to fetch expiry items", 
          details: "Database error in fallback query",
          originalError: dbError instanceof Error ? dbError.message : String(dbError)
        }, { status: 500 });
      }
    }
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
    
    // Convert string ID to integer if needed
    const numericUserId = parseInt(userId, 10);
    console.log(`Creating item for user ID: ${numericUserId}`);

    const { barcode, item_name, price, weight, category, image_url, quantity, expiry_date } = await request.json();

    const result = await pool.query(
      `INSERT INTO expiry_items 
       (user_id, barcode, item_name, price, weight, category, image_url, quantity, expiry_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [numericUserId, barcode, item_name, price, weight, category, image_url, quantity, expiry_date]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating expiry item:", error);
    return NextResponse.json(
      { error: "Failed to create expiry item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 