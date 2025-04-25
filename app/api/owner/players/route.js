import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Use connectDB() for a better connection handling

export async function GET() {
  try {
    const client = await connectDB();
    const db = client.db("bayou-side-tennis");

    const players = await db
      .collection("users")
      .aggregate([
        // Filter for players
        { $match: { role: "player" } },
        // Convert _id to string for lookups
        {
          $addFields: {
            userIdStr: { $toString: "$_id" },
          },
        },
        // Lookup bookings for the player
        {
          $lookup: {
            from: "bookings",
            localField: "userIdStr",
            foreignField: "playerId",
            as: "bookings",
          },
        },
        // Debug bookings match
        {
          $addFields: {
            bookingsDebug: {
              userIdStr: "$userIdStr",
              matchedBookings: {
                $map: {
                  input: "$bookings",
                  as: "booking",
                  in: {
                    playerId: "$$booking.playerId",
                    status: "$$booking.status",
                    startTime: "$$booking.startTime",
                  },
                },
              },
              uniqueStatuses: {
                $setUnion: ["$bookings.status", []],
              },
            },
          },
        },
        // Lookup payments for the player
        {
          $lookup: {
            from: "payments",
            localField: "userIdStr",
            foreignField: "userId",
            as: "payments",
          },
        },
        // Unwind payments to process each payment
        {
          $unwind: { path: "$payments", preserveNullAndEmptyArrays: true },
        },
        // Filter for only completed payments
        {
          $match: {
            $or: [
              { "payments.status": "completed" },
              { payments: { $exists: false } }, // Handle players with no payments
            ],
          },
        },
        // Lookup booking details for each payment
        {
          $lookup: {
            from: "bookings",
            localField: "payments.bookingId",
            foreignField: "_id",
            as: "payments.booking",
          },
        },
        {
          $unwind: {
            path: "$payments.booking",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup coach details
        {
          $lookup: {
            from: "coaches",
            localField: "payments.booking.coachId",
            foreignField: "userId",
            as: "payments.coach",
          },
        },
        {
          $unwind: {
            path: "$payments.coach",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup settings
        {
          $lookup: {
            from: "settings",
            pipeline: [{ $limit: 1 }],
            as: "payments.settings",
          },
        },
        {
          $unwind: {
            path: "$payments.settings",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Convert coach.rate to double and calculate duration
        {
          $addFields: {
            "payments.coachRateNumeric": {
              $cond: [
                {
                  $and: [
                    { $ne: ["$payments.coach.rate", null] },
                    { $ne: ["$payments.coach.rate", ""] },
                    { $isNumber: { $toDouble: "$payments.coach.rate" } },
                  ],
                },
                { $toDouble: "$payments.coach.rate" },
                0,
              ],
            },
            "payments.durationHours": {
              $cond: [
                {
                  $and: [
                    { $ne: ["$payments.booking.startTime", null] },
                    { $ne: ["$payments.booking.endTime", null] },
                    {
                      $gt: [
                        { $toDate: "$payments.booking.endTime" },
                        { $toDate: "$payments.booking.startTime" },
                      ],
                    },
                  ],
                },
                {
                  $divide: [
                    {
                      $subtract: [
                        { $toDate: "$payments.booking.endTime" },
                        { $toDate: "$payments.booking.startTime" },
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
        // Calculate ownerShare for each payment (in cents)
        {
          $addFields: {
            "payments.ownerShare": {
              $cond: [
                { $eq: ["$payments.status", "completed"] },
                {
                  $round: [
                    {
                      $add: [
                        // Court rental cost (already in cents)
                        { $ifNull: ["$payments.settings.courtRentalCost", 0] },
                        // Coach fee portion (convert dollars to cents)
                        {
                          $multiply: [
                            {
                              $multiply: [
                                "$payments.coachRateNumeric",
                                "$payments.durationHours",
                              ],
                            },
                            {
                              $divide: [
                                {
                                  $subtract: [
                                    100,
                                    {
                                      $ifNull: [
                                        "$payments.settings.coachFeeSplitPercentage",
                                        60,
                                      ],
                                    },
                                  ],
                                },
                                100,
                              ],
                            },
                            100, // Convert coach fee from dollars to cents
                          ],
                        },
                        // Ball machine cost (already in cents)
                        {
                          $cond: [
                            { $eq: ["$payments.booking.ballMachine", true] },
                            {
                              $ifNull: [
                                "$payments.settings.ballMachineCost",
                                0,
                              ],
                            },
                            0,
                          ],
                        },
                      ],
                    },
                    2,
                  ],
                },
                0, // No ownerShare for non-completed payments
              ],
            },
          },
        },
        // Debug ownerShare
        {
          $addFields: {
            "payments.ownerShareDebug": {
              courtRentalCost: "$payments.settings.courtRentalCost",
              coachFee: {
                $multiply: [
                  "$payments.coachRateNumeric",
                  "$payments.durationHours",
                ],
              },
              coachFeeSplitPercentage:
                "$payments.settings.coachFeeSplitPercentage",
              ballMachineUsed: "$payments.booking.ballMachine",
              ballMachineCost: "$payments.settings.ballMachineCost",
            },
          },
        },
        // Group by player to aggregate results
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            email: { $first: "$email" },
            phone: { $first: "$phone" },
            bookings: { $first: "$bookings" },
            bookingsDebug: { $first: "$bookingsDebug" },
            totalPaid: { $sum: "$payments.ownerShare" },
          },
        },
        // Project final fields
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            bookingCount: {
              $cond: [
                { $gt: [{ $size: "$bookings" }, 0] },
                {
                  $size: {
                    $filter: {
                      input: "$bookings",
                      as: "booking",
                      cond: {
                        $in: ["$$booking.status", ["confirmed", "completed"]], // Placeholder
                      },
                    },
                  },
                },
                "", // Return empty string for no bookings
              ],
            },
            totalPaid: {
              $cond: [
                { $gt: [{ $size: "$bookings" }, 0] },
                "$totalPaid",
                "", // Return empty string for no bookings
              ],
            },
            lastBooking: {
              $cond: [
                {
                  $and: [
                    { $gt: [{ $size: "$bookings" }, 0] },
                    { $ifNull: [{ $max: "$bookings.startTime" }, false] },
                  ],
                },
                {
                  $dateToString: {
                    format: "%Y-%m-%d %H:%M",
                    date: { $max: "$bookings.startTime" },
                    timezone: "America/Chicago",
                  },
                },
                "", // Return empty string for no bookings or invalid dates
              ],
            },
            bookingsDebug: 1, // For debugging
          },
        },
      ])
      .toArray();

    // Format lastBooking to 12-hour format
    const formattedPlayers = players.map((player) => {
      let formattedLastBooking = player.lastBooking;
      let debugInfo = {
        lastBookingRaw: player.lastBooking,
        startTimes: player.bookings
          ? player.bookings.map((b) => b.startTime)
          : [],
      };

      if (player.lastBooking !== "") {
        try {
          const [date, time] = player.lastBooking.split(" ");
          const dateObj = new Date(`${date}T${time}:00-05:00`); // America/Chicago (UTC-5)
          if (!isNaN(dateObj.getTime())) {
            formattedLastBooking = dateObj.toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
              timeZone: "America/Chicago",
            });
          } else {
            formattedLastBooking = "";
            debugInfo.error = "Invalid date object";
          }
        } catch (e) {
          formattedLastBooking = "";
          debugInfo.error = e.message;
        }
      }

      return {
        ...player,
        lastBooking: formattedLastBooking,
        lastBookingDebug: debugInfo,
      };
    });

    console.log(`Fetched ${formattedPlayers.length} players`, formattedPlayers);
    return NextResponse.json(formattedPlayers);
  } catch (error) {
    console.error("GET /api/owner/players error:", {
      message: error.message,
      stack: error.stack,
      details: error,
    });
    return NextResponse.json(
      { error: "Failed to fetch players", details: error.message },
      { status: 500 }
    );
  }
}
