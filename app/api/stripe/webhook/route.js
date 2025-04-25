// app/api/booking/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      playerId,
      coachId,
      startTime,
      endTime,
      totalCost,
      ballMachine = false,
    } = body;

    if (
      !playerId ||
      !coachId ||
      !startTime ||
      !endTime ||
      totalCost === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required booking fields." },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const newBooking = {
      _id: new ObjectId(),
      playerId,
      coachId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      day: new Date(startTime).toLocaleDateString("en-US", {
        timeZone: "America/Chicago",
      }),
      totalCost,
      ballMachine,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("bookings").insertOne(newBooking);

    return NextResponse.json({ success: true, bookingId: newBooking._id });
  } catch (error) {
    console.error("Booking POST error:", error);
    return NextResponse.json(
      { error: "Failed to create booking." },
      { status: 500 }
    );
  }
}
