import { NextResponse } from "next/server";
import clientPromise from "@/utils/mongodb"; // Update path if needed
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const booking = await db
      .collection("bookings")
      .aggregate([
        {
          $match: { _id: new ObjectId(bookingId) },
        },
        {
          $lookup: {
            from: "users",
            let: { playerId: "$playerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$playerId" }],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            startTime: 1,
            endTime: 1,
            status: 1,
            ballMachine: 1,
            totalCost: 1,
          },
        },
      ])
      .next();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    console.log(`Booking details for bookingId ${bookingId}:`, booking);
    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}
