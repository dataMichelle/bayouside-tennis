import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await connectDB();

    const payments = await db
      .collection("payments")
      .aggregate([
        { $match: { status: "completed" } },
        {
          $addFields: {
            userIdObj: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$userId", null] },
                    { $ne: ["$userId", ""] },
                    {
                      $regexMatch: {
                        input: "$userId",
                        regex: /^[a-f\d]{24}$/i,
                      },
                    },
                  ],
                },
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
          $lookup: {
            from: "settings",
            pipeline: [{ $limit: 1 }],
            as: "settings",
          },
        },
        { $unwind: { path: "$settings", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
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
          },
        },
        {
          $project: {
            _id: 1,
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            totalAmount: "$amount",
            coachFee: {
              $round: [
                { $multiply: ["$coachRateNumeric", "$durationHours"] },
                2,
              ],
            },
            ownerShare: {
              $round: [
                {
                  $add: [
                    { $ifNull: ["$settings.courtRentalCost", 0] },
                    {
                      $multiply: [
                        { $multiply: ["$coachRateNumeric", "$durationHours"] },
                        {
                          $divide: [
                            {
                              $subtract: [
                                100,
                                {
                                  $ifNull: [
                                    "$settings.coachFeeSplitPercentage",
                                    60,
                                  ],
                                },
                              ],
                            },
                            100,
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        { $eq: ["$booking.ballMachine", true] },
                        { $ifNull: ["$settings.ballMachineCost", 0] },
                        0,
                      ],
                    },
                  ],
                },
                2,
              ],
            },
            status: 1,
            bookingTime: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$booking", null] },
                    { $ne: ["$booking.startTime", null] },
                    { $ne: ["$booking.endTime", null] },
                    { $eq: [{ $type: "$booking.startTime" }, "string"] },
                    { $eq: [{ $type: "$booking.endTime" }, "string"] },
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
                "N/A",
              ],
            },
          },
        },
      ])
      .toArray();

    const formattedPayments = payments.map((payment) => {
      if (payment.bookingTime && payment.bookingTime !== "N/A") {
        try {
          const [start, end] = payment.bookingTime.split(" - ");
          const [date, startTime] = start.split(" ");
          const startDate = new Date(`${date}T${startTime}:00-05:00`);
          const endDate = new Date(`${date}T${end}:00-05:00`);

          if (isNaN(startDate) || isNaN(endDate)) {
            throw new Error("Invalid date format");
          }

          const formattedStart = startDate.toLocaleString("en-US", {
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

          return {
            ...payment,
            bookingTime: `${date} ${formattedStart} - ${formattedEnd}`,
          };
        } catch (err) {
          console.error("Error formatting bookingTime:", {
            paymentId: payment._id,
            bookingTime: payment.bookingTime,
            error: err.message,
          });
          return { ...payment, bookingTime: "Invalid Date" };
        }
      }
      return payment;
    });

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("GET /api/owner/payments error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uri: process.env.MONGODB_URI ? "MONGODB_URI set" : "MONGODB_URI missing",
    });
    return NextResponse.json(
      {
        error: "Failed to load payments",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
