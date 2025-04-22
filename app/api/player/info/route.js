import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    console.log("Fetching settings for ballMachineCost and courtRentalCost");
    const settings = await db.collection("settings").findOne({});
    const ballMachineCost = settings?.ballMachineCost
      ? Number(settings.ballMachineCost) // Keep as number, no formatting
      : 0;
    const courtRentalCost = settings?.courtRentalCost
      ? Number(settings.courtRentalCost) // Keep as number, no formatting
      : 0;

    const response = {
      ballMachineCost,
      courtRentalCost,
    };

    console.log("Response data:", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ API /player/info GET error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings data" },
      { status: 500 }
    );
  }
}