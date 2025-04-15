import { NextResponse } from "next/server";
import clientPromise from "../../../utils/mongodb";
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

    console.log(
      `Fetching bookings for coachId: ${coachId}, range: ${startOfMonth} to ${endOfMonth}`
    );

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // Debug: Check all bookings for coachId
    const allBookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();
    console.log(
      `All bookings for coachId ${coachId}:`,
      JSON.stringify(allBookings, null, 2)
    );

    const bookings = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            coachId, // String (Firebase UID)
            startTime: {
              $gte: new Date(startOfMonth),
              $lte: new Date(endOfMonth),
            },
            status: "confirmed",
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
            coachId: "$coachId",
          },
        },
      ])
      .toArray();

    console.log(
      `Confirmed bookings for coachId ${coachId} from ${startOfMonth} to ${endOfMonth}:`,
      JSON.stringify(bookings, null, 2)
    );
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
