import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await connectDB(); // Use connectDB() for proper connection handling

    // Fetch coaches
    const coaches = await db.collection("coaches").find({}).limit(5).toArray();

    // Count weekly bookings per coach
    const startOfWeek = new Date();
    const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const bookingCounts = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            status: "confirmed",
            startTime: { $gte: startOfWeek, $lte: endOfWeek },
          },
        },
        {
          $group: {
            _id: "$coachId",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Map booking counts to coaches
    const coachesWithBookings = coaches.map((coach) => ({
      ...coach,
      _id: coach._id.toString(),
      weeklyBookings:
        bookingCounts.find((bc) => bc._id === coach.userId)?.count || 0,
    }));

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

    // Fetch upcoming reservations
    const reservations = await db
      .collection("bookings")
      .aggregate([
        {
          $match: {
            status: "confirmed",
            startTime: { $gte: startOfWeek, $lte: endOfWeek },
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

    // Count total weekly bookings
    const totalBookings = await db.collection("bookings").countDocuments({
      status: "confirmed",
      startTime: { $gte: startOfWeek, $lte: endOfWeek },
    });

    console.log("Dashboard API - Returning data:", {
      coaches: coachesWithBookings.length,
      payments: payments.length,
      reservations: reservations.length,
    });

    return NextResponse.json({
      coaches: coachesWithBookings,
      payments: payments.map((p) => ({
        ...p,
        _id: p._id.toString(),
        bookingId: p.bookingId.toString(),
      })),
      settings,
      reservations: reservations.map((r) => ({ ...r, _id: r._id.toString() })),
      totalRevenue,
      pendingPayments,
      totalBookings,
    });
  } catch (error) {
    console.error("Dashboard API - Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: error.message },
      { status: 500 }
    );
  }
}
