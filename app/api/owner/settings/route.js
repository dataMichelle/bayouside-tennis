// app/api/owner/settings/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

const SETTINGS_ID = new ObjectId("67f04bfe9f9297149eb71237"); // use your actual ID

export async function GET() {
  try {
    const client = await connectDB();
    const db = client.db("bayou-side-tennis");
    const settings = await db
      .collection("settings")
      .findOne({ _id: SETTINGS_ID });
    if (!settings)
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/owner/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json();
    const client = await connectDB();
    const db = client.db("bayou-side-tennis");

    const result = await db.collection("settings").updateOne(
      { _id: SETTINGS_ID },
      {
        $set: {
          courtRentalCost: data.courtRentalCost,
          ballMachineCost: data.ballMachineCost,
          coachFeeSplitPercentage: data.coachFeeSplitPercentage,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Settings not updated" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/owner/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
