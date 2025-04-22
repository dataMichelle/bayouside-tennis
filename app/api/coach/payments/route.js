import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { coachId } = await request.json();
    if (!coachId) {
      return NextResponse.json({ error: "Missing coachId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    console.log("Fetching coach for coachId:", coachId);
    const coach = await db.collection("coaches").findOne({ userId: coachId });
    console.log(
      "Coach found:",
      coach ? { userId: coach.userId, rate: coach.rate } : "No coach found"
    );

    console.log("Fetching bookings for coachId:", coachId);
    const bookings = await db
      .collection("bookings")
      .find({ coachId, status: { $in: ["confirmed", "completed"] } })
      .toArray();

    console.log(
      "Found bookings:",
      bookings.length,
      bookings.map((b) => ({
        _id: b._id.toString(),
        coachId: b.coachId,
        status: b.status,
        startTime: b.startTime,
        endTime: b.endTime,
        totalCost: b.totalCost,
      }))
    );

    if (bookings.length === 0) {
      console.log("No bookings found for coachId:", coachId);
      return NextResponse.json(
        { payments: [], totalCoachPayments: 0 },
        { status: 200 }
      );
    }

    const bookingIds = bookings.map((booking) =>
      booking._id instanceof ObjectId ? booking._id : new ObjectId(booking._id)
    );
    console.log(
      "Booking IDs:",
      bookingIds.map((id) => id.toString())
    );

    const settings = await db.collection("settings").findOne({});
    const coachFeeSplitPercentage = settings?.coachFeeSplitPercentage ?? 60;
    console.log("Coach fee split percentage:", coachFeeSplitPercentage);

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
                  $and: [
                    { $ne: ["$booking.startTime", null] },
                    { $ne: ["$booking.endTime", null] },
                    {
                      $gt: [
                        { $toDate: "$booking.endTime" },
                        { $toDate: "$booking.startTime" },
                      ],
                    },
                  ],
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
            coachRateNumeric: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$coach.rate", null] },
                    { $ne: ["$coach.rate", ""] },
                    { $isNumber: { $toDouble: "$coach.rate" } },
                  ],
                },
                { $toDouble: "$coach.rate" },
                0,
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            amount: "$amount", // Assume amount is in dollars
            coachFee: {
              $round: [
                {
                  $multiply: [
                    "$coachRateNumeric",
                    "$durationHours",
                    coachFeeSplitPercentage / 100,
                  ],
                },
                2,
              ],
            },
            createdAt: 1,
            status: 1,
            bookingTime: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$booking.startTime", null] },
                    { $ne: ["$booking.endTime", null] },
                  ],
                },
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
                "-",
              ],
            },
            debug: {
              rawAmount: "$amount",
              coachRate: "$coachRateNumeric",
              durationHours: "$durationHours",
              coachFeeSplitPercentage: coachFeeSplitPercentage,
            },
          },
        },
      ])
      .toArray();

    console.log(
      "Found payments:",
      payments.length,
      payments.map((p) => ({
        _id: p._id.toString(),
        bookingId: p.booking?._id?.toString(),
        playerName: p.playerName,
        amount: p.amount,
        coachFee: p.coachFee,
        debug: p.debug,
      }))
    );

    // Format bookingTime to 12-hour format and calculate total coach payments
    const formattedPayments = payments.map((payment) => {
      let formattedBookingTime = payment.bookingTime;
      if (payment.bookingTime !== "-") {
        try {
          const [start, end] = payment.bookingTime.split(" - ");
          const [date, startTime] = start.split(" ");
          const startDate = new Date(`${date}T${startTime}:00-05:00`);
          const endDate = new Date(`${date}T${end}:00-05:00`);

          const formattedStart = startDate.toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "America/Chicago",
          });
          const formattedEnd = endDate.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "America/Chicago",
          });

          formattedBookingTime = `${formattedStart} - ${formattedEnd}`;
        } catch (e) {
          console.error(
            "Error formatting bookingTime for payment:",
            payment._id,
            e
          );
          formattedBookingTime = "-";
        }
      }

      return {
        ...payment,
        bookingTime: formattedBookingTime,
      };
    });

    // Calculate total coach payments
    const totalCoachPayments = formattedPayments.reduce(
      (sum, payment) => sum + (payment.coachFee || 0),
      0
    );

    console.log(
      `Fetched ${formattedPayments.length} payments`,
      formattedPayments.map((p) => ({
        _id: p._id.toString(),
        playerName: p.playerName,
        amount: p.amount,
        coachFee: p.coachFee,
        bookingTime: p.bookingTime,
        status: p.status,
        createdAt: p.createdAt,
        debug: p.debug,
      }))
    );
    return NextResponse.json(
      { payments: formattedPayments, totalCoachPayments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching coach payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments", details: error.message },
      { status: 500 }
    );
  }
}
