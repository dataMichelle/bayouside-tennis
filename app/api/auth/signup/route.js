import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("Received request to /api/signup:", {
    method: request.method,
    url: request.url,
  });

  try {
    const body = await request.json();
    console.log("Request body:", body);

    const { name, email, phone, uid, role } = body;

    // Validation
    if (!name || !email || !phone || !uid || !role) {
      console.error("Missing required fields:", {
        name,
        email,
        phone,
        uid,
        role,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const validRoles = ["player", "coach", "owner"];
    if (!validRoles.includes(role)) {
      console.error("Invalid role:", role);
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Connect to MongoDB
    const db = await connectDB();
    console.log("Connected to MongoDB");

    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      console.error("Email already exists:", email);
      return NextResponse.json(
        { error: "Email already exists" },
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser);
    console.log("User created in MongoDB:", {
      userId: result.insertedId,
      email,
      role,
    });

    return NextResponse.json(
      { message: "User created", userId: result.insertedId },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
