// app/api/booking/route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const booking = await request.json();
    if (
      !booking ||
      !booking.playerId ||
      !booking.startTime ||
      !booking.endTime
    ) {
      return NextResponse.json(
        { error: "Missing booking fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const newBooking = {
      ...booking,
      coachId: booking.coachId || null,
      status: "pending",
      updatedAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);

    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("POST booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "Missing bookingId or status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const result = await db
      .collection("bookings")
      .updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { status, updatedAt: new Date() } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Booking updated" }, { status: 200 });
  } catch (error) {
    console.error("PATCH booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
