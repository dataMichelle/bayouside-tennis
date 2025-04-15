import { NextResponse } from "next/server";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { coachId } = await request.json();
    if (!coachId) {
      console.error("Missing coachId");
      return NextResponse.json({ error: "Missing coachId" }, { status: 400 });
    }

    console.log(`Querying payments for coachId: ${coachId}`);
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // Debug: Check all bookings
    const bookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();
    console.log(`Bookings found for coachId ${coachId}:`, JSON.stringify(bookings, null, 2));

    if (bookings.length === 0) {
      console.log(`No bookings found for coachId: ${coachId}`);
      return NextResponse.json([], { status: 200 });
    }

    const bookingIds = bookings.map((booking) => new ObjectId(booking._id));
    console.log(`Booking IDs:`, bookingIds);

    const payments = await db
      .collection("payments")
      .aggregate([
        {
          $match: {
            bookingId: { $in: bookingIds },
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
              { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$userId" }] } } }
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$_id",
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            amount: { $divide: ["$amount", 100] },
            currency: "$currency",
            status: "$status",
            createdAt: "$createdAt",
            bookingTime: {
              $cond: {
                if: "$booking.startTime",
                then: {
                  $concat: [
                    { $dateToString: { format: "%Y-%m-%d %H:%M", date: { $toDate: "$booking.startTime" } } },
                    " - ",
                    { $dateToString: { format: "%H:%M", date: { $toDate: "$booking.endTime" } } },
                  ],
                },
                else: "N/A",
              },
            },
          },
        },
      ])
      .toArray();

    console.log(`Payments found for coachId ${coachId}:`, JSON.stringify(payments, null, 2));
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error(`Error fetching payments for coachId:`, error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}