import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  let client;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const coaches = await db.collection("coaches").find().toArray();
    return NextResponse.json(coaches);
  } catch (error) {
    console.error("Coaches fetch error:", {
      message: error.message,
      uri: process.env.MONGODB_URI ? "URI present" : "URI missing",
    });
    return NextResponse.json(
      { error: "Failed to fetch coaches", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
