import { NextResponse } from "next/server";
import clientPromise from "../../utils/mongodb";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    // Assume Firebase Admin verifies token; simplified here
    const { uid, email } = { uid: token, email: "unknown@example.com" }; // Replace with firebase-admin

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    let user = await db.collection("users").findOne({ _id: uid });
    if (!user) {
      console.log(`User not found for uid: ${uid}, creating new user`);
      user = {
        _id: uid,
        email: email || "unknown@example.com",
        name: "New User",
        role: "player", // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection("users").insertOne(user);
      console.log(`Created new user:`, user);
    }

    return NextResponse.json({ role: user.role || "player" }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
