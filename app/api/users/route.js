// app/api/users/route.js
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getUserByFirebaseUid } from "@/lib/db/users";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const user = await getUserByFirebaseUid(decodedToken.uid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { role: user.role || "player", _id: user._id.toString() },
      { status: 200 }
    );
  } catch (error) {
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
