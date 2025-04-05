import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request) {
  let client;
  try {
    console.log("API - GET /api/users - Starting...");
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("API - No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    console.log("API - Verifying token...");
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("API - Verified userId from token:", userId);

    if (!process.env.MONGODB_URI) {
      console.log("API - MONGODB_URI not defined");
      throw new Error("MONGODB_URI is not defined");
    }

    console.log("API - Connecting to MongoDB...");
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    console.log("API - Connected to MongoDB");

    console.log("API - Querying user with _id as ObjectId:", userId);
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    console.log("API - Queried user:", user);

    if (!user) {
      console.log("API - User not found, returning player role");
      return NextResponse.json({ role: "player" }, { status: 200 });
    }

    console.log("API - Returning role:", user.role || "player");
    return NextResponse.json({ role: user.role || "player" }, { status: 200 });
  } catch (error) {
    console.error("API - Error in GET /api/users:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) {
      console.log("API - Closing MongoDB connection");
      await client.close();
    }
  }
}
