import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(req) {
  try {
    const { bookingIds } = await req.json();

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      console.error("Invalid booking IDs:", bookingIds);
      return NextResponse.json(
        { error: "Invalid booking IDs: must be a non-empty array" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    const allVerified = await Promise.all(
      bookingIds.map(async (bookingId) => {
        try {
          const booking = await db
            .collection("bookings")
            .findOne({ _id: new ObjectId(bookingId) });
          if (!booking) {
            console.error(`Booking not found: ${bookingId}`);
            return false;
          }
          if (!booking.stripeSessionId) {
            console.error(`No Stripe session ID for booking: ${bookingId}`);
            return false;
          }

          const session = await stripe.checkout.sessions.retrieve(
            booking.stripeSessionId
          );

          if (session.payment_status !== "paid") {
            return false;
          }

          // Update booking to confirmed
          const updateResult = await db
            .collection("bookings")
            .updateOne(
              { _id: new ObjectId(bookingId) },
              { $set: { status: "confirmed", updatedAt: new Date() } }
            );

          // Check for existing payment to prevent duplicates
          const existingPayment = await db.collection("payments").findOne({
            bookingId: new ObjectId(bookingId),
          });
          if (existingPayment) {
            return true;
          }

          // Insert payment record
          const paymentResult = await db.collection("payments").insertOne({
            _id: new ObjectId(),
            bookingId: new ObjectId(bookingId),
            userId: booking.playerId,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: "completed",
            stripePaymentId: session.payment_intent,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return true;
        } catch (error) {
          console.error(
            `Error processing booking ${bookingId}:`,
            error.message,
            error.stack
          );
          return false;
        }
      })
    );

    return NextResponse.json(
      { allVerified: allVerified.every((v) => v) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payments:", error.message, error.stack);
    return NextResponse.json(
      { error: `Failed to verify payments: ${error.message}` },
      { status: 500 }
    );
  }
}
