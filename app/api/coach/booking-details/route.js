import { NextResponse } from "next/server";
import clientPromise from "../../../utils/mongodb";
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
          $match: {
            _id: new ObjectId(bookingId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "playerId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$_id",
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            startTime: "$startTime",
            endTime: "$endTime",
            status: "$status",
            ballMachine: "$ballMachine",
            totalCost: "$totalCost",
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
