import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const payments = await db
      .collection("payments")
      .aggregate([
        { $match: { status: "completed" } },
        // Convert userId to ObjectId if valid
        {
          $addFields: {
            userIdObj: {
              $cond: [
                { $regexMatch: { input: "$userId", regex: /^[a-f\d]{24}$/i } },
                { $toObjectId: "$userId" },
                null,
              ],
            },
          },
        },
        // Lookup user details
        {
          $lookup: {
            from: "users",
            localField: "userIdObj",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        // Lookup booking details
        {
          $lookup: {
            from: "bookings",
            localField: "bookingId",
            foreignField: "_id",
            as: "booking",
          },
        },
        { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } },
        // Lookup coach details
        {
          $lookup: {
            from: "coaches",
            localField: "booking.coachId",
            foreignField: "userId",
            as: "coach",
          },
        },
        { $unwind: { path: "$coach", preserveNullAndEmptyArrays: true } },
        // Lookup settings
        {
          $lookup: {
            from: "settings",
            pipeline: [{ $limit: 1 }],
            as: "settings",
          },
        },
        { $unwind: { path: "$settings", preserveNullAndEmptyArrays: true } },
        // Convert coach.rate to double and calculate duration
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
        // Project final fields
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
                "N/A",
              ],
            },
          },
        },
      ])
      .toArray();

    // Transform bookingTime to 12-hour format
    const formattedPayments = payments.map((payment) => {
      if (payment.bookingTime !== "N/A") {
        const [start, end] = payment.bookingTime.split(" - ");
        const [date, startTime] = start.split(" ");
        const startDate = new Date(`${date}T${startTime}:00-05:00`); // Assuming America/Chicago (UTC-5)
        const endDate = new Date(`${date}T${end}:00-05:00`);

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
      }
      return payment;
    });

    console.log(
      `Fetched ${formattedPayments.length} payments`,
      formattedPayments
    );
    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("GET /api/owner/payments error:", {
      message: error.message,
      stack: error.stack,
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
