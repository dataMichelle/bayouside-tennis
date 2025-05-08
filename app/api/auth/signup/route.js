import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, uid, role, password } = body;

    // Strict validation
    if (!name || !email || !phone || !uid || !role || !password) {
      console.error("Missing fields:", {
        name,
        email,
        phone,
        uid,
        role,
        password,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", {
        email,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const validRoles = ["player", "coach", "owner"];
    if (!validRoles.includes(role)) {
      console.error("Invalid role:", {
        role,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({
      $or: [{ email }, { firebaseUid: uid }],
    });
    if (existingUser) {
      console.error("User already exists in MongoDB:", {
        email,
        uid,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "User with this email or UID already exists" },
        { status: 400 }
      );
    }

    const newUser = {
      _id: new ObjectId(),
      firebaseUid: uid,
      name,
      email,
      phone,
      role,
      password, // Store password as plaintext
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    return NextResponse.json(
      { message: "User created", userId: result.insertedId },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Signup error:", {
      message: err.message || "Unknown error",
      stack: err.stack || "No stack",
      name: err.name || "Unknown",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
