// app/api/payments/verify/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingIdsParam = searchParams.get("bookingIds");

    if (!bookingIdsParam) {
      return NextResponse.json(
        { error: "Missing bookingIds query param" },
        { status: 400 }
      );
    }

    const bookingIds = JSON.parse(bookingIdsParam);
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const updatedBookings = await db
      .collection("bookings")
      .find({ _id: { $in: bookingIds.map((id) => new ObjectId(id)) } })
      .toArray();

    return NextResponse.json({ bookings: updatedBookings }, { status: 200 });
  } catch (err) {
    console.error("Error verifying payments:", err);
    return NextResponse.json(
      { error: "Failed to verify payment status" },
      { status: 500 }
    );
  }
}
