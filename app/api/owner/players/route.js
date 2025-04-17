// app/api/owner/players/route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const players = await db
      .collection("users")
      .find({ role: "player" })
      .project({ name: 1, email: 1, phone: 1 })
      .toArray();

    return NextResponse.json(players);
  } catch (error) {
    console.error("GET /api/owner/players error:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
