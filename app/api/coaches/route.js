import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET() {
  try {
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const coaches = await db.collection("coaches").find().toArray();
    return NextResponse.json(coaches);
  } catch (error) {
    console.error("Coaches fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
