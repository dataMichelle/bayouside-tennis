import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

// Helper function to calculate the total cost for a booking
function calculateTotalCost(booking) {
  let totalCost = 0;

  // Assuming each booking has a `totalCost` field (this should be set when booking is created)
  totalCost += booking.totalCost || 0;

  // Add additional costs like ball machine or other custom fees, if needed
  if (booking.ballMachine) {
    totalCost += 80; // Example additional cost for the ball machine
  }

  return totalCost;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    const db = await connectDB(); // Ensure the connection is handled via connectDB()

    // Fetch all bookings for the player
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

    // Add coach information and calculate total cost for each booking
    const bookingsWithCoach = bookings.map((booking) => {
      const coach = coachesMap[booking.coachId] || null;

      // Calculate total cost (use your cost calculation logic here)
      const totalCost = calculateTotalCost(booking);

      return {
        ...booking,
        coach,
        totalCost, // Add the calculated total cost here
      };
    });

    return NextResponse.json({ bookings: bookingsWithCoach }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch player reservations:", err);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
