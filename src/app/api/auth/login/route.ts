import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface UserData {
  id: string;
  email: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Check password
    const passwordMatch = await compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Create a simple session identifier
    const sessionId = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    // Set cookie
    cookies().set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    // Return user data without the name property if it doesn't exist
    const userData: UserData = {
      id: user.id,
      email: user.email
    };
    
    // Add name property only if it exists
    if (user.name) {
      userData.name = user.name;
    }
    
    return NextResponse.json(
      { success: true, user: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
} 