import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getUserByFirebaseUid } from "@/lib/db/users";

export async function GET(request) {
  try {
    console.log("getUserByFirebaseUid import:", typeof getUserByFirebaseUid);
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    console.log("Verifying Firebase ID token");
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    console.log("Fetching user with firebaseUid:", firebaseUid);
    if (typeof getUserByFirebaseUid !== "function") {
      throw new Error("getUserByFirebaseUid is not a function");
    }
    const user = await getUserByFirebaseUid(firebaseUid);

    if (!user) {
      console.log("User not found for firebaseUid:", firebaseUid);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", user);
    return NextResponse.json({
      _id: user._id.toString(),
      role: user.role || "player",
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user", details: error.message },
      { status: 500 }
    );
  }
}

// 🚫 POST is disabled
export async function POST() {
  return NextResponse.json(
    { error: "POST not allowed on /api/users" },
    { status: 403 }
  );
}
