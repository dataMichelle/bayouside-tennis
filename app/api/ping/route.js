// app/api/ping/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const count = await db.collection("users").countDocuments();

    return NextResponse.json({ message: "Connected", userCount: count });
  } catch (err) {
    return NextResponse.json(
      { error: "MongoDB failed", details: err.message },
      { status: 500 }
    );
  }
}
