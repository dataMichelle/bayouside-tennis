// app/api/delete-firebase-user/route.js
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.deleteUser(user.uid);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting Firebase user:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}
