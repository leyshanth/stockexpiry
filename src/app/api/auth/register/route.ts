import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    console.log("Register API route called");
    
    const body = await request.json();
    const { name, email, password } = body;
    
    console.log("Received registration data:", { name, email, password: "***" });

    if (!name || !email || !password) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log("Checking if user exists");
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("User already exists");
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log("Hashing password");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("Creating user");
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    console.log("User created successfully:", user);

    return NextResponse.json(
      { message: "User registered successfully", user },
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