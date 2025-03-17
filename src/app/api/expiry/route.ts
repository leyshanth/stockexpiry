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
    
    // Convert to numeric user ID (handle both string and number types)
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    console.log(`Using numeric user ID: ${numericUserId}`);
    
    try {
      // First try to get items with the specific user ID
      const result = await pool.query(
        "SELECT * FROM expiry_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY expiry_date ASC",
        [numericUserId]
      );
      
      console.log(`Found ${result.rows.length} expiry items for user ${numericUserId}`);
      
      if (result.rows.length === 0) {
        // If no items found, try getting items with NULL user_id as a fallback
        console.log("No items found for this user, checking for items with NULL user_id");
        const nullResult = await pool.query(
          "SELECT * FROM expiry_items WHERE user_id IS NULL AND deleted_at IS NULL ORDER BY expiry_date ASC"
        );
        
        console.log(`Found ${nullResult.rows.length} expiry items with NULL user_id`);
        
        // If still no items, try getting all items as a last resort
        if (nullResult.rows.length === 0) {
          console.log("No items found with NULL user_id, getting all items");
          const allResult = await pool.query(
            "SELECT * FROM expiry_items WHERE deleted_at IS NULL ORDER BY expiry_date ASC LIMIT 10"
          );
          
          console.log(`Found ${allResult.rows.length} total expiry items`);
          return NextResponse.json({ 
            items: allResult.rows,
            note: "Showing all items because no items found for your user ID"
          });
        }
        
        return NextResponse.json({ 
          items: nullResult.rows,
          note: "Showing items with no user ID because no items found for your user ID"
        });
      }
      
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
        
        // Try to get all items as a last resort
        const allItems = await pool.query(
          "SELECT * FROM expiry_items WHERE deleted_at IS NULL ORDER BY expiry_date ASC LIMIT 10"
        );
        
        return NextResponse.json({ 
          items: allItems.rows,
          note: "Showing all items due to an error with user filtering"
        });
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
    
    // Convert to numeric user ID (handle both string and number types)
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
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