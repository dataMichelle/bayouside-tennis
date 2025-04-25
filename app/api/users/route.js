import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getUserByFirebaseUid } from "@/lib/db/users";

export async function GET(request) {
  try {
    console.log("✅ /api/users route hit");

    const authHeader = request.headers.get("authorization");

    // Check for authorization header
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Verifying Firebase ID token...");

    // Verify Firebase ID Token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    console.log("👤 Firebase UID decoded:", firebaseUid);

    // Ensure function is available and fetch the user
    if (typeof getUserByFirebaseUid !== "function") {
      console.error("❌ getUserByFirebaseUid is not defined or misconfigured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const user = await getUserByFirebaseUid(firebaseUid);

    // Check if user is found
    if (!user) {
      console.warn("⚠️ No user found for Firebase UID:", firebaseUid);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Successful retrieval
    console.log("✅ User found:", user.name || user.email || user._id);

    return NextResponse.json({
      _id: user._id.toString(),
      role: user.role || "player", // Default to "player" if role is undefined
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    // Log the error details
    console.error("❌ GET /api/users error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch user", details: error.message },
      { status: 500 }
    );
  }
}

// POST method is not allowed
export async function POST() {
  return NextResponse.json(
    { error: "POST not allowed on /api/users" },
    { status: 403 }
  );
}
