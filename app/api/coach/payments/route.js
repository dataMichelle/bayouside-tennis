import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { coachId } = await request.json();
    if (!coachId) {
      return NextResponse.json({ error: "Missing coachId" }, { status: 400 });
    }

    const db = await connectDB();

    const coach = await db.collection("coaches").findOne({ userId: coachId });

    const bookings = await db
      .collection("bookings")
      .find({ coachId, status: { $in: ["confirmed", "completed"] } })
      .toArray();

    if (bookings.length === 0) {
      return NextResponse.json(
        { payments: [], totalCoachPayments: 0 },
        { status: 200 }
      );
    }

    const bookingIds = bookings.map((booking) =>
      booking._id instanceof ObjectId ? booking._id : new ObjectId(booking._id)
    );

    const settings = await db.collection("settings").findOne({});
    const coachFeeSplitPercentage = settings?.coachFeeSplitPercentage ?? 60;

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
            amount: "$amount",
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

    const totalCoachPayments = formattedPayments.reduce(
      (sum, payment) => sum + (payment.coachFee || 0),
      0
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
