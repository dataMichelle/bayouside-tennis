// app/api/users/route.js
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getUserByFirebaseUid } from "@/lib/db/users";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header", { authHeader });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    if (typeof getUserByFirebaseUid !== "function") {
      console.error("❌ getUserByFirebaseUid is not defined or misconfigured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      console.warn("⚠️ No user found for Firebase UID:", firebaseUid);
      return NextResponse.json(
        {
          error: "User not found",
          details: `No user with firebaseUid: ${firebaseUid}`,
        },
        { status: 404 }
      );
    }

    console.log("User fetched successfully:", {
      firebaseUid,
      email: user.email,
    });
    return NextResponse.json({
      _id: user._id.toString(),
      role: user.role || "player",
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("❌ GET /api/users error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Failed to fetch user", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "POST not allowed on /api/users" },
    { status: 403 }
  );
}
