import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  // Named export
  let client;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const settings = await db.collection("settings").findOne();
    if (!settings) {
      throw new Error("Settings not found");
    }
    return NextResponse.json({
      courtRentalCost: settings.courtRentalCost,
      ballMachineCost: settings.ballMachineCost,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
