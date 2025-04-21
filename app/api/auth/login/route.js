// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
  let client;
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const user = await db.collection("users").findOne({ email });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.firebaseUid) {
      return NextResponse.json(
        { error: "User configuration error" },
        { status: 500 }
      );
    }

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);

    return NextResponse.json({
      token: customToken,
      role: user.role || "player",
      _id: user._id.toString(),
    });
  } catch (error) {
    console.error("POST /api/auth/login - Error:", error.message);
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    );
  } finally {
    if (process.env.NODE_ENV === "production" && client) {
      await client.close();
    }
  }
}
