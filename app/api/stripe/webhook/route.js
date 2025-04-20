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

    console.log("Webhook request received:", {
      signature: signature ? "[present]" : "[missing]",
      hasWebhookSecret: !!webhookSecret,
      bodyLength: body.length,
      timestamp: new Date().toISOString(),
      origin: request.headers.get("origin"),
      url: request.url,
    });

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    console.log("Webhook event processed:", {
      type: event.type,
      id: event.id,
      timestamp: new Date(event.created * 1000).toISOString(),
      sessionId: event.data.object?.id,
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { bookingIds, userId, totalCost } = session.metadata;

      let bookingIdsArray;
      try {
        bookingIdsArray = JSON.parse(bookingIds);
        console.log("Parsed bookingIds:", bookingIdsArray);
      } catch (err) {
        console.error("Failed to parse bookingIds:", {
          error: err.message,
          bookingIds,
          stack: err.stack,
        });
        return NextResponse.json(
          { error: "Invalid bookingIds format" },
          { status: 400 }
        );
      }

      const amountTotal = session.amount_total; // In cents
      const currency = session.currency;
      const stripePaymentId = session.payment_intent;

      console.log("Checkout session completed:", {
        sessionId: session.id,
        bookingIds: bookingIdsArray,
        userId,
        amountTotal,
        currency,
        stripePaymentId,
        totalCost,
        paymentStatus: session.payment_status,
      });

      // Connect to MongoDB
      console.log("Connecting to MongoDB...");
      let client;
      try {
        client = await clientPromise;
        console.log("MongoDB connected successfully");
      } catch (err) {
        console.error("Failed to connect to MongoDB:", {
          error: err.message,
          stack: err.stack,
        });
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }

      const db = client.db("bayou-side-tennis");

      // Validate userId
      console.log("Validating userId:", { userId });
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (!user) {
        console.error("User not found for _id:", { userId });
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      console.log("User validated:", { userId, firebaseUid: user.firebaseUid });

      // Validate all bookingIds
      console.log("Validating bookingIds:", bookingIdsArray);
      const invalidBookings = await Promise.all(
        bookingIdsArray.map(async (bookingId) => {
          try {
            const booking = await db
              .collection("bookings")
              .findOne({ _id: new ObjectId(bookingId) });
            if (!booking) {
              console.error("Booking not found:", { bookingId });
              return bookingId;
            }
            console.log("Booking validated:", {
              bookingId,
              playerId: booking.playerId,
              status: booking.status,
            });
            return null;
          } catch (err) {
            console.error("Error validating bookingId:", {
              bookingId,
              error: err.message,
              stack: err.stack,
            });
            return bookingId;
          }
        })
      ).then((results) => results.filter((id) => id !== null));
      if (invalidBookings.length > 0) {
        console.error("Invalid bookingIds found:", invalidBookings);
        return NextResponse.json(
          { error: `Invalid bookingIds: ${invalidBookings.join(", ")}` },
          { status: 400 }
        );
      }

      // Use a transaction to ensure atomicity
      console.log("Starting MongoDB transaction for payments and bookings");
      const sessionDb = client.startSession();
      try {
        await sessionDb.withTransaction(async () => {
          // Save payment records
          const paymentPromises = bookingIdsArray.map(async (bookingId) => {
            try {
              // Check for existing payment to prevent duplicates
              const existingPayment = await db
                .collection("payments")
                .findOne(
                  { bookingId: new ObjectId(bookingId), stripePaymentId },
                  { session: sessionDb }
                );
              if (existingPayment) {
                console.log("Payment already exists for bookingId:", {
                  bookingId,
                  paymentId: existingPayment._id,
                });
                return existingPayment;
              }

              const newPayment = {
                _id: new ObjectId(),
                bookingId: new ObjectId(bookingId), // Store as ObjectId
                userId: userId.toString(),
                amount: Math.round(amountTotal / bookingIdsArray.length),
                currency,
                status: "completed",
                stripePaymentId,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              console.log("Attempting to save payment:", {
                bookingId,
                userId,
                amount: newPayment.amount,
                stripePaymentId,
              });

              const result = await db
                .collection("payments")
                .insertOne(newPayment, { session: sessionDb });
              console.log("Payment saved successfully:", {
                paymentId: result.insertedId,
                bookingId,
                userId,
                amount: newPayment.amount,
              });
              return newPayment;
            } catch (err) {
              console.error("Failed to save payment for bookingId:", {
                bookingId,
                error: err.message,
                stack: err.stack,
              });
              throw err; // Rethrow to trigger transaction rollback
            }
          });

          const payments = await Promise.all(paymentPromises);
          console.log("Payments processing complete:", {
            successful: payments.length,
            total: bookingIdsArray.length,
          });

          if (payments.length !== bookingIdsArray.length) {
            console.error("Not all payments were saved:", {
              expected: bookingIdsArray.length,
              actual: payments.length,
            });
            throw new Error("Not all payments were saved");
          }

          // Update booking statuses
          const updatePromises = bookingIdsArray.map(async (bookingId) => {
            try {
              console.log("Attempting to update booking:", { bookingId });
              const result = await db.collection("bookings").updateOne(
                { _id: new ObjectId(bookingId) },
                {
                  $set: {
                    status: "confirmed",
                    updatedAt: new Date().toISOString(),
                  },
                },
                { session: sessionDb }
              );
              console.log("Booking update result:", {
                bookingId,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
              });
              if (result.matchedCount === 0) {
                console.warn("Booking not found for update:", { bookingId });
              } else if (result.modifiedCount === 0) {
                console.warn("Booking not updated (no changes):", {
                  bookingId,
                });
              }
              return result;
            } catch (err) {
              console.error("Failed to update booking:", {
                bookingId,
                error: err.message,
                stack: err.stack,
              });
              throw err; // Rethrow to trigger transaction rollback
            }
          });

          const updateResults = await Promise.all(updatePromises);
          console.log("Bookings update results:", {
            total: updateResults.length,
            successful: updateResults.filter((r) => r && r.modifiedCount > 0)
              .length,
          });
        });
        console.log("Transaction completed successfully");
        return NextResponse.json({ received: true }, { status: 200 });
      } catch (err) {
        console.error("Transaction failed:", {
          message: err.message,
          stack: err.stack,
        });
        return NextResponse.json(
          { error: "Failed to process payments and bookings" },
          { status: 500 }
        );
      } finally {
        console.log("Ending MongoDB session");
        await sessionDb.endSession();
      }
    } else {
      console.log("Unhandled event type:", event.type);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Webhook error:", {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
}
