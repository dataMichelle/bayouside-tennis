import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      console.error("Missing email field:", {
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    const exists = !!existingUser;

    return NextResponse.json({ exists }, { status: 200 });
  } catch (err) {
    console.error("❌ User existence check error:", {
      message: err.message || "Unknown error",
      stack: err.stack || "No stack",
      name: err.name || "Unknown",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
