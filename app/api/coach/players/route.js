import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const coachId = body.coachId;

    if (!coachId) {
      console.log("Missing coachId in request");
      return NextResponse.json(
        { error: "Coach ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching players for coachId:", coachId);
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // Find bookings for the coach
    const bookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();

    console.log(
      "Found bookings:",
      bookings.length,
      bookings.map((b) => ({
        _id: b._id.toString(),
        playerId: b.playerId,
        status: b.status,
      }))
    );

    // Get unique player IDs
    const playerIds = [...new Set(bookings.map((b) => b.playerId))];
    console.log("Unique player IDs:", playerIds);

    // Fetch player details and latest payment status
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
              {
                $sort: { "payment.updatedAt": -1 }, // Latest payment first
              },
              {
                $limit: 1, // Get only the latest payment
              },
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

    console.log(
      "Found players:",
      players.length,
      players.map((p) => ({
        _id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        paymentStatus: p.paymentStatus || "N/A",
      }))
    );

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("❌ API /coach/players error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch players" },
      { status: 500 }
    );
  }
}
