import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await connectDB(); // Use connectDB() for proper connection handling

    // Fetch coaches
    const coaches = await db.collection("coaches").find({}).toArray();

    // Set the start of the current year (January 1st of the current year)
    const startOfYear = new Date(Date.UTC(new Date().getFullYear(), 0, 1)); // Jan 1st, 2025, UTC
    const endOfYear = new Date(Date.UTC(new Date().getFullYear() + 1, 0, 0)); // Dec 31st, 2025, UTC

    // Set the start of this week (Monday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Adjust for the start of the week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    // Set the end of this week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Adjust to Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    // Count total bookings per coach for the year
    const totalBookingsPerCoach = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            status: "confirmed", // Consider only confirmed bookings
            startTime: { $gte: startOfYear, $lte: endOfYear }, // Filter bookings for the year
          },
        },
        {
          $group: {
            _id: "$coachId", // Group by coachId
            totalBookings: { $sum: 1 }, // Count total bookings for each coach
          },
        },
      ])
      .toArray();

    // Map total bookings count to coaches
    const coachesWithBookings = coaches.map((coach) => {
      const totalBookings =
        totalBookingsPerCoach.find(
          (item) => item._id.toString() === coach.userId
        )?.totalBookings || 0;

      return {
        ...coach,
        _id: coach._id.toString(),
        totalBookings, // Add totalBookings field to each coach
      };
    });

    // Fetch recent payments
    const payments = await db
      .collection("payments")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Calculate total revenue (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalRevenueResult = await db
      .collection("payments")
      .aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray();
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Count pending payments
    const pendingPayments = await db
      .collection("payments")
      .countDocuments({ status: "pending" });

    // Fetch settings (create if not exists)
    let settings = await db.collection("settings").findOne({});
    if (!settings) {
      settings = {
        courtRentalRate: 20,
        ballMachineFee: 10,
        maxBookingDuration: 2,
      };
      await db.collection("settings").insertOne(settings);
    }

    // Fetch upcoming reservations for this week
    const reservations = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            status: "confirmed",
            startTime: { $gte: startOfWeek, $lte: endOfWeek }, // This week
          },
        },
        {
          $lookup: {
            from: "users",
            let: { playerIdStr: "$playerId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", { $toObjectId: "$$playerIdStr" }] },
                },
              },
            ],
            as: "player",
          },
        },
        {
          $lookup: {
            from: "coaches",
            let: { coachIdStr: "$coachId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$userId", "$$coachIdStr"] },
                },
              },
            ],
            as: "coach",
          },
        },
        { $unwind: { path: "$player", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$coach", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            startTime: 1,
            endTime: 1,
            playerName: { $ifNull: ["$player.name", "Unknown"] },
            coachName: { $ifNull: ["$coach.name", "No Coach"] },
            status: 1,
          },
        },
        { $sort: { startTime: 1 } },
        { $limit: 5 },
      ])
      .toArray();

    return NextResponse.json({
      coaches: coachesWithBookings,
      payments: payments.map((p) => ({
        ...p,
        _id: p._id.toString(),
        bookingId: p.bookingId.toString(),
      })),
      settings,
      reservations: reservations.map((r) => ({
        ...r,
        _id: r._id.toString(),
      })),
      totalRevenue,
      pendingPayments,
    });
  } catch (error) {
    console.error("Dashboard API - Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: error.message },
      { status: 500 }
    );
  }
}
