// app/api/ping/route.js
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await connectDB();
    const db = client.db("bayou-side-tennis");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "MongoDB failed", details: err.message },
      { status: 500 }
    );
  }
}
