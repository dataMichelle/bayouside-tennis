import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const payments = await db
      .collection("payments")
      .aggregate([
        { $match: { status: "completed" } },

        {
          $addFields: {
            userIdObj: {
              $cond: [
                { $regexMatch: { input: "$userId", regex: /^[a-f\d]{24}$/i } },
                { $toObjectId: "$userId" },
                null,
              ],
            },
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "userIdObj",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "bookings",
            localField: "bookingId",
            foreignField: "_id",
            as: "booking",
          },
        },
        { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "coaches",
            localField: "booking.coachId",
            foreignField: "userId",
            as: "coach",
          },
        },
        { $unwind: { path: "$coach", preserveNullAndEmptyArrays: true } },

        {
          $addFields: {
            durationHours: {
              $cond: [
                {
                  $and: ["$booking.startTime", "$booking.endTime"],
                },
                {
                  $divide: [
                    {
                      $subtract: [
                        { $toDate: "$booking.endTime" },
                        { $toDate: "$booking.startTime" },
                      ],
                    },
                    1000 * 60 * 60,
                  ],
                },
                1,
              ],
            },
          },
        },

        {
          $project: {
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            totalAmount: "$amount",
            coachFee: {
              $round: [
                {
                  $multiply: ["$coach.rate", "$durationHours"],
                },
                0,
              ],
            },
            ownerShare: {
              $round: [
                {
                  $subtract: [
                    "$amount",
                    {
                      $multiply: ["$coach.rate", "$durationHours"],
                    },
                  ],
                },
                0,
              ],
            },
            status: 1,
            bookingTime: {
              $cond: [
                { $and: ["$booking.startTime", "$booking.endTime"] },
                {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d %H:%M",
                        date: { $toDate: "$booking.startTime" },
                        timezone: "America/Chicago",
                      },
                    },
                    " - ",
                    {
                      $dateToString: {
                        format: "%H:%M",
                        date: { $toDate: "$booking.endTime" },
                        timezone: "America/Chicago",
                      },
                    },
                  ],
                },
                "N/A",
              ],
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json(payments);
  } catch (error) {
    console.error("GET /api/owner/payments error:", error);
    return NextResponse.json(
      { error: "Failed to load payments", details: error.message },
      { status: 500 }
    );
  }
}
