// app/api/ping/route.js
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    await client.db().admin().ping(); // check if connected
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "MongoDB failed", details: err.message },
      { status: 500 }
    );
  }
}
