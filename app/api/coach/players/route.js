import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const coachId = body.coachId;

    if (!coachId) {
      return NextResponse.json(
        { error: "Coach ID is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Find bookings for the coach
    const bookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();

    const playerIds = [...new Set(bookings.map((b) => b.playerId))];

    if (playerIds.length === 0) {
      return NextResponse.json({ players: [] }, { status: 200 });
    }

    const players = await db
      .collection("users")
      .aggregate([
        {
          $match: {
            _id: { $in: playerIds.map((id) => new ObjectId(id)) },
          },
        },
        {
          $lookup: {
            from: "bookings",
            let: { playerId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$playerId", "$$playerId"] },
                      { $eq: ["$coachId", coachId] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "payments",
                  localField: "_id",
                  foreignField: "bookingId",
                  as: "payment",
                },
              },
              {
                $unwind: { path: "$payment", preserveNullAndEmptyArrays: true },
              },
              { $sort: { "payment.updatedAt": -1 } },
              { $limit: 1 },
              {
                $project: {
                  paymentStatus: "$payment.status",
                },
              },
            ],
            as: "latestPayment",
          },
        },
        {
          $unwind: {
            path: "$latestPayment",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            name: 1,
            email: 1,
            phone: 1,
            paymentStatus: "$latestPayment.paymentStatus",
          },
        },
      ])
      .toArray();

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("❌ API /coach/players error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch players" },
      { status: 500 }
    );
  }
}
