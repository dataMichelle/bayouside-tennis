import { NextResponse } from "next/server";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      return NextResponse.json(
        { error: "Missing webhook secret or signature" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const session = event.data.object;
    const { bookingIds, userId, totalCost } = session.metadata;
    const amountTotal = session.amount_total;
    const currency = session.currency;
    const stripePaymentId = session.payment_intent;

    const parsedBookingIds = JSON.parse(bookingIds);
    const db = (await clientPromise).db("bayou-side-tennis");

    const sessionDb = (await clientPromise).startSession();
    await sessionDb.withTransaction(async () => {
      for (const bookingId of parsedBookingIds) {
        const payment = {
          _id: new ObjectId(),
          bookingId: new ObjectId(bookingId),
          userId,
          amount: Math.round(amountTotal / parsedBookingIds.length),
          currency,
          status: "completed",
          stripePaymentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Prevent duplicate payments
        const existing = await db.collection("payments").findOne({
          bookingId: new ObjectId(bookingId),
          stripePaymentId,
        });

        if (!existing) {
          await db
            .collection("payments")
            .insertOne(payment, { session: sessionDb });
        }

        await db.collection("bookings").updateOne(
          { _id: new ObjectId(bookingId) },
          {
            $set: {
              status: "confirmed",
              updatedAt: new Date().toISOString(),
            },
          },
          { session: sessionDb }
        );
      }
    });

    await sessionDb.endSession();
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
