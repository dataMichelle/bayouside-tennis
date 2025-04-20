import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { coachId } = await request.json();
    if (!coachId) {
      return NextResponse.json({ error: "Missing coachId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const bookings = await db
      .collection("bookings")
      .find({ coachId, status: "confirmed" })
      .toArray();

    if (bookings.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const bookingIds = bookings.map((booking) =>
      booking._id instanceof ObjectId ? booking._id : new ObjectId(booking._id)
    );

    const settings = await db.collection("settings").findOne({});
    const coachFeeSplitPercentage = settings?.coachFeeSplitPercentage ?? 50;

    const payments = await db
      .collection("payments")
      .aggregate([
        {
          $match: {
            bookingId: { $in: bookingIds },
            status: "completed",
          },
        },
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
            from: "users",
            let: { userId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", { $toObjectId: "$$userId" }] },
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
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
            _id: 1,
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            amount: { $divide: ["$amount", 100] },
            coachRate: "$coach.rate",
            durationHours: 1,
            coachFee: {
              $round: [
                {
                  $divide: [
                    {
                      $multiply: [
                        "$coach.rate",
                        "$durationHours",
                        coachFeeSplitPercentage,
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
            createdAt: 1,
            currency: 1,
            status: 1,
            bookingTime: {
              $cond: [
                "$booking.startTime",
                {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d %H:%M",
                        date: { $toDate: "$booking.startTime" },
                      },
                    },
                    " - ",
                    {
                      $dateToString: {
                        format: "%H:%M",
                        date: { $toDate: "$booking.endTime" },
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

    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error("Error fetching coach payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments", details: error.message },
      { status: 500 }
    );
  }
}
