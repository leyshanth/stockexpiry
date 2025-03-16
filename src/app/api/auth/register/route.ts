import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password, storeName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password, store_name) VALUES ($1, $2, $3) RETURNING id, email, store_name",
      [email, hashedPassword, storeName]
    );

    const newUser = result.rows[0];

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        storeName: newUser.store_name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
} 