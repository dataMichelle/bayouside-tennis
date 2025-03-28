import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

export async function POST(request) {
  try {
    const { name, email, password, role, phone } = await request.json();

    await client.connect();
    const db = client.db("bayou-side-tennis");
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const newUser = {
      _id: new ObjectId(),
      name,
      email,
      password,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      phone, // Now included
      ...(role === "coach"
        ? { coachDetails: { rating: 4.9, specialty: "Tennis" } }
        : {}),
    };

    const result = await db.collection("users").insertOne(newUser);
    return NextResponse.json(
      { message: "User created", userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
