import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    const db = await connectDB();
    const bookings = await db
      .collection("bookings")
      .find({ playerId })
      .sort({ startTime: 1 })
      .toArray();

    const coachIds = [
      ...new Set(bookings.map((b) => b.coachId).filter(Boolean)),
    ];

    let coachesMap = {};
    if (coachIds.length > 0) {
      const coaches = await db
        .collection("coaches")
        .find({ userId: { $in: coachIds } })
        .toArray();

      coachesMap = coaches.reduce((acc, coach) => {
        acc[coach.userId] = coach;
        return acc;
      }, {});
    }

    // Map bookings to include coach info and ensure costBreakdown is included
    const bookingsWithCoach = bookings.map((booking) => ({
      ...booking,
      _id: booking._id.toString(), // Convert ObjectId to string for frontend
      coach: coachesMap[booking.coachId] || null,
      totalCost: booking.totalCost || 0,
      costBreakdown: booking.costBreakdown || {
        coachFee: 0,
        courtFee: 0,
        machineFee: 0,
      },
    }));

    return NextResponse.json({ bookings: bookingsWithCoach }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch player reservations:", err);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
