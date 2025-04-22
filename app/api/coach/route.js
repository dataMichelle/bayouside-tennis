import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const coaches = await db.collection("coaches").find({}).toArray();

    const sanitizedCoaches = coaches.map((coach) => ({
      _id: coach._id.toString(),
      name: coach.name || "Unknown Coach",
      specialty: coach.specialty || "Unknown",
      bio: coach.bio || "",
      availability: Array.isArray(coach.availability) ? coach.availability : [],
      rate: coach.rate || "0",
      userId: coach.userId || null,
    }));

    return NextResponse.json(sanitizedCoaches, { status: 200 });
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { coachId } = await request.json();
    if (!coachId) {
      console.log("Missing coachId in request");
      return NextResponse.json(
        { error: "Coach ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    console.log("Fetching user for firebaseUid:", coachId);
    const user = await db.collection("users").findOne({ firebaseUid: coachId });
    if (!user) {
      console.log("User not found for firebaseUid:", coachId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Fetching coach for userId:", user._id.toString());
    const coach = await db.collection("coaches").findOne({ userId: user._id.toString() });
    if (!coach) {
      console.log("Coach not found for userId:", user._id.toString());
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Fetch upcoming bookings (current month, as in schedule/route.js)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    console.log("Fetching bookings for coachId:", user._id.toString());
    const bookings = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            coachId: user._id.toString(),
            startTime: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $in: ["confirmed", "completed"] }, // Relaxed status
          },
        },
        {
          $lookup: {
            from: "users",
            let: { playerIdStr: "$playerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$playerIdStr" }],
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
            _id: { $toString: "$_id" },
            playerName: { $ifNull: ["$user.name", "Unknown"] },
            startTime: 1,
            endTime: 1,
            status: 1,
            bookingTime: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$startTime", null] },
                    { $ne: ["$endTime", null] },
                  ],
                },
                {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d %H:%M",
                        date: "$startTime",
                        timezone: "America/Chicago",
                      },
                    },
                    " - ",
                    {
                      $dateToString: {
                        format: "%H:%M",
                        date: "$endTime",
                        timezone: "America/Chicago",
                      },
                    },
                  ],
                },
                "-",
              ],
            },
          },
        },
      ])
      .toArray();

    console.log(
      "Found bookings:",
      bookings.length,
      bookings.map(b => ({
        _id: b._id,
        playerName: b.playerName,
        bookingTime: b.bookingTime,
        status: b.status,
        startTime: b.startTime,
      }))
    );

    // Fetch latest payments (limit 5)
    console.log("Fetching payments for coachId:", user._id.toString());
    const bookingsForPayments = await db
      .collection("bookings")
      .find({ coachId: user._id.toString(), status: { $in: ["confirmed", "completed"] } })
      .toArray();

    console.log(
      "Bookings for payments:",
      bookingsForPayments.length,
      bookingsForPayments.map(b => ({
        _id: b._id.toString(),
        coachId: b.coachId,
        status: b.status,
        startTime: b.startTime,
      }))
    );

    const bookingIds = bookingsForPayments.map((booking) =>
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
            status: { $in: ["completed", "pending"] }, // Relaxed status
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
            _id: { $toString: "$_id" },
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
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    console.log(
      "Found payments:",
      payments.length,
      payments.map(p => ({
        _id: p._id,
        playerName: p.playerName,
        amount: p.amount,
        coachFee: p.coachFee,
        bookingTime: p.bookingTime,
        status: p.status,
        createdAt: p.createdAt,
      }))
    );

    // Format bookingTime for payments
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
          console.error("Error formatting bookingTime for payment:", payment._id, e);
          formattedBookingTime = "-";
        }
      }

      return {
        ...payment,
        bookingTime: formattedBookingTime,
      };
    });

    const response = {
      name: coach.name || "Unknown Coach",
      rate: coach.rate || "0",
      bookings,
      payments: formattedPayments,
    };

    console.log("Response data:", {
      name: response.name,
      rate: response.rate,
      bookings: bookings.length,
      payments: payments.length,
    });
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ API /coach POST error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coach data" },
      { status: 500 }
    );
  }
}