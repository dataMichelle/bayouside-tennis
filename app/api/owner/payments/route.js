// app/api/owner/payments/route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const payments = await db
      .collection("payments")
      .find({ status: "completed" })
      .toArray();
    const bookings = await db.collection("bookings").find({}).toArray();
    const users = await db.collection("users").find({}).toArray();
    const coaches = await db.collection("coaches").find({}).toArray();

    const coachMap = Object.fromEntries(
      coaches.map((c) => [c.userId, parseFloat(c.rate) || 0])
    );
    const userMap = Object.fromEntries(
      users.map((u) => [u.firebaseUid, u.name || "Unknown"])
    );
    const bookingMap = Object.fromEntries(
      bookings.map((b) => [b._id.toString(), b])
    );

    const result = payments.map((p) => {
      const booking = bookingMap[p.bookingId?.toString()];
      const playerName = userMap[p.userId] || "Unknown";
      const coachRate = coachMap[booking?.coachId] || 0;

      const durationHours =
        booking?.startTime && booking?.endTime
          ? (new Date(booking.endTime) - new Date(booking.startTime)) /
            (1000 * 60 * 60)
          : 1;

      const coachFee = Math.round(coachRate * durationHours * 100);
      const totalAmount = p.amount;
      const ownerShare = totalAmount - coachFee;

      const bookingTime =
        booking?.startTime && booking?.endTime
          ? `${new Date(booking.startTime).toLocaleString("en-US", {
              timeZone: "America/Chicago",
            })} - ${new Date(booking.endTime).toLocaleTimeString("en-US", {
              timeZone: "America/Chicago",
            })}`
          : "N/A";

      return {
        _id: p._id,
        playerName,
        totalAmount,
        coachFee,
        ownerShare,
        status: p.status,
        bookingTime,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/owner/payments error:", error);
    return NextResponse.json(
      { error: "Failed to load payments" },
      { status: 500 }
    );
  }
}
