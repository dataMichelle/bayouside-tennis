import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()

export async function GET() {
  try {
    const db = await connectDB();

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

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ API /player/info GET error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings data" },
      { status: 500 }
    );
  }
}
