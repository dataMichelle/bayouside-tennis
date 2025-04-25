import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()

export async function GET() {
  try {
    const db = await connectDB();
    const settings = await db.collection("settings").findOne();
    if (!settings) {
      throw new Error("Settings not found");
    }

    // Validate required fields exist
    if (
      typeof settings.courtRentalCost !== "number" ||
      typeof settings.ballMachineCost !== "number"
    ) {
      throw new Error("Missing required settings values");
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
