import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await connectDB();

    const bookings = await db
      .collection("bookings")
      .aggregate([
        {
          $match: { status: "confirmed" },
        },
        {
          $addFields: {
            playerIdObj: { $toObjectId: "$playerId" },
            coachIdObj: { $toObjectId: "$coachId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "playerIdObj",
            foreignField: "_id",
            as: "player",
          },
        },
        {
          $unwind: { path: "$player", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "users",
            localField: "coachIdObj",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: { path: "$coach", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            start: "$startTime",
            end: "$endTime",
            ballMachine: "$ballMachine",
            title: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$player", null] },
                    { $eq: ["$coach", null] },
                    "$ballMachine",
                  ],
                },
                then: "Ball Machine Rental",
                else: {
                  $concat: [
                    { $ifNull: ["$player.name", "Player"] },
                    " w/ ",
                    { $ifNull: ["$coach.name", "No Coach"] },
                    {
                      $cond: [
                        { $eq: ["$ballMachine", true] },
                        " (Ball Machine)",
                        "",
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/owner/schedule error:", error);
    return NextResponse.json(
      { error: "Failed to load schedule" },
      { status: 500 }
    );
  }
}
