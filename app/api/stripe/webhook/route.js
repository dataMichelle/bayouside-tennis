import { NextResponse } from "next/server";
import Stripe from "stripe";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    let event;

    console.log("Webhook received, verifying signature...");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      console.log("Webhook event verified:", event.type);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      let bookingIds, userId;

      try {
        bookingIds = paymentIntent.metadata.bookingIds
          ? JSON.parse(paymentIntent.metadata.bookingIds)
          : [];
        userId = paymentIntent.metadata.userId;
      } catch (err) {
        console.error("Failed to parse metadata:", paymentIntent.metadata, err);
        return NextResponse.json(
          { error: "Invalid metadata" },
          { status: 400 }
        );
      }

      console.log("PaymentIntent succeeded:", {
        paymentIntentId: paymentIntent.id,
        bookingIds,
        userId,
        amount: paymentIntent.amount,
      });

      if (!bookingIds.length || !userId) {
        console.error("Missing metadata:", paymentIntent.metadata);
        return NextResponse.json(
          { error: "Missing bookingIds or userId" },
          { status: 400 }
        );
      }

      const client = await clientPromise;
      const db = client.db("bayou-side-tennis");

      // Save payments
      const paymentPromises = bookingIds.map(async (bookingId) => {
        try {
          const payment = {
            _id: new ObjectId(),
            bookingId: new ObjectId(bookingId),
            userId,
            amount: paymentIntent.amount / bookingIds.length, // Split amount
            currency: paymentIntent.currency,
            status: "completed",
            stripePaymentId: paymentIntent.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const result = await db.collection("payments").insertOne(payment);
          console.log(`Payment saved for bookingId ${bookingId}:`, result);
          return result;
        } catch (err) {
          console.error(
            `Failed to save payment for bookingId ${bookingId}:`,
            err
          );
          throw err;
        }
      });

      await Promise.all(paymentPromises);

      // Update booking statuses
      const updatePromises = bookingIds.map(async (bookingId) => {
        try {
          const result = await db
            .collection("bookings")
            .updateOne(
              { _id: new ObjectId(bookingId) },
              {
                $set: {
                  status: "confirmed",
                  updatedAt: new Date().toISOString(),
                },
              }
            );
          console.log(`Booking ${bookingId} update result:`, result);
          return result;
        } catch (err) {
          console.error(`Failed to update booking ${bookingId}:`, err);
          throw err;
        }
      });

      await Promise.all(updatePromises);
      console.log("Webhook processed successfully:", bookingIds);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 500 }
    );
  }
}
