// app/api/coach/schedule/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { coachId, startOfMonth, endOfMonth } = await request.json();

    if (!coachId || !startOfMonth || !endOfMonth) {
      console.error("Missing required fields:", {
        coachId,
        startOfMonth,
        endOfMonth,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const startDate = new Date(startOfMonth);
    const endDate = new Date(endOfMonth);

    const bookings = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            coachId, // Still a string
            startTime: { $gte: startDate, $lte: endDate },
            status: "confirmed",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { playerIdStr: "$playerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$playerIdStr" }],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 1,
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            startTime: 1,
            endTime: 1,
            status: 1,
            ballMachine: 1,
            totalCost: 1,
            coachId: 1,
          },
        },
      ])
      .toArray();

    console.log(`Returning ${bookings.length} bookings for coachId ${coachId}`);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/coach/schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule", details: error.message },
      { status: 500 }
    );
  }
}
