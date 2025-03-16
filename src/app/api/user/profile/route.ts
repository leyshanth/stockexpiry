import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import { hash } from "bcrypt";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeName, newPassword } = await request.json();

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update store name
      if (storeName) {
        await client.query(
          "UPDATE users SET store_name = $1 WHERE id = $2",
          [storeName, session.user.id]
        );
      }
      
      // Update password if provided
      if (newPassword) {
        // Hash new password
        const hashedPassword = await hash(newPassword, 10);
        
        // Update password
        await client.query(
          "UPDATE users SET password = $1 WHERE id = $2",
          [hashedPassword, session.user.id]
        );
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({ message: "Profile updated successfully" });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 