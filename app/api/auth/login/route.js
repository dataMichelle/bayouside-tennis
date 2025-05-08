import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      console.error("Missing email or password:", {
        email,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const user = await db.collection("users").findOne({ email });

    if (!user || user.password !== password) {
      console.error("Invalid credentials for email:", {
        email,
        userFound: !!user,
        passwordProvided: !!password,
        hasPasswordField: user ? !!user.password : false,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.firebaseUid) {
      console.error("User configuration error: Missing firebaseUid for user:", {
        email,
        userId: user._id.toString(),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "User configuration error" },
        { status: 500 }
      );
    }

    // Generate a Firebase custom token

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);

    // Return the response with the token and user details

    return NextResponse.json({
      token: customToken,
      role: user.role || "player",
      _id: user._id.toString(),
    });
  } catch (error) {
    console.error("POST /api/auth/login - Error:", {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    );
  }
}
