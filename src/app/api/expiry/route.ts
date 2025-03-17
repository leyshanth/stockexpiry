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
    
    // Check if the expiry_items table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expiry_items')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log("expiry_items table does not exist, creating it...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS expiry_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          barcode VARCHAR(255),
          item_name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2),
          weight VARCHAR(255),
          category VARCHAR(255),
          image_url TEXT,
          quantity INTEGER DEFAULT 1,
          expiry_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `);
      console.log("expiry_items table created");
      
      // Return empty array since the table was just created
      return NextResponse.json({ items: [] });
    }
    
    // Get expiry items from database for this specific user
    const result = await pool.query(
      "SELECT * FROM expiry_items WHERE user_id = $1 AND deleted_at IS NULL ORDER BY expiry_date ASC",
      [numericUserId]
    );
    
    console.log(`Found ${result.rows.length} expiry items for user ${numericUserId}`);
    
    if (result.rows.length === 0) {
      // If no items found, try getting all items as a fallback
      console.log("No items found for this user, getting all items");
      const allResult = await pool.query(
        "SELECT * FROM expiry_items WHERE deleted_at IS NULL ORDER BY expiry_date ASC LIMIT 10"
      );
      
      console.log(`Found ${allResult.rows.length} total expiry items`);
      return NextResponse.json({ 
        items: allResult.rows,
        note: "Showing all items because no items found for your user ID"
      });
    }
    
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching expiry items:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch expiry items", 
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Try visiting /api/test-db to diagnose database issues or /api/repair-db to repair the database"
      },
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