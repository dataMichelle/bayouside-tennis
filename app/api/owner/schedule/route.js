// app/api/owner/schedule/route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

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
            title: {
              $cond: {
                if: "$ballMachine",
                then: "Ball Machine Rental",
                else: {
                  $concat: [
                    { $ifNull: ["$player.name", "Player"] },
                    " w/ ",
                    { $ifNull: ["$coach.name", "Coach"] },
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
