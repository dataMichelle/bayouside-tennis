import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function POST(req) {
  const { bookingIds } = await req.json();
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return NextResponse.json({ error: "Invalid bookingIds" }, { status: 400 });
  }

  const client = await connectDB();
  const db = client.db("bayou-side-tennis");

  let allVerified = true;

  for (const id of bookingIds) {
    const payments = await db
      .collection("payments")
      .find({ bookingId: new ObjectId(id), status: "succeeded" })
      .toArray();

    if (payments.length > 0) {
      await db
        .collection("bookings")
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "confirmed", updatedAt: new Date() } }
        );
    } else {
      allVerified = false;
    }
  }

  return NextResponse.json({ allVerified });
}
