import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
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
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error.message },
      { status: 500 }
    );
  }
}
