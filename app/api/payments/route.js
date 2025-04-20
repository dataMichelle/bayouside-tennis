import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request) {
  try {
    const { bookingId, userId, amount, stripePaymentId } = await request.json();

    if (!bookingId || !userId || !amount || !stripePaymentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // Create the payment
    const newPayment = {
      _id: new ObjectId(),
      bookingId: new ObjectId(bookingId),
      userId,
      amount: parseFloat(amount),
      currency: "USD",
      status: "completed",
      stripePaymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("payments").insertOne(newPayment);

    // Update the booking status
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "confirmed",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Payment recorded and booking confirmed",
    });
  } catch (err) {
    console.error("PATCH /api/payments error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
