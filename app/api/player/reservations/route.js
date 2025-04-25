import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    const db = await connectDB(); // Ensure the connection is handled via connectDB()

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

    const bookingsWithCoach = bookings.map((booking) => ({
      ...booking,
      coach: coachesMap[booking.coachId] || null,
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
