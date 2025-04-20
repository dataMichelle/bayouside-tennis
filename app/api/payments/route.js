import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    console.log("GET /api/payments called:", { bookingId });

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    if (bookingId) {
      console.log("Fetching payment for bookingId:", { bookingId });
      const payment = await db
        .collection("payments")
        .findOne({ bookingId: new ObjectId(bookingId) });
      if (!payment) {
        console.log("No payment found for bookingId:", { bookingId });
        return NextResponse.json(null, { status: 404 });
      }
      console.log("Payment found:", { paymentId: payment._id, bookingId });
      return NextResponse.json(payment, { status: 200 });
    } else {
      const payments = await db.collection("payments").find().toArray();
      console.log("Payments fetched:", payments.length);
      return NextResponse.json(payments, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching payments:", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { bookingId, userId, amount, currency, stripePaymentId } =
      await request.json();

    console.log("Payment POST received:", {
      bookingId,
      userId,
      amount,
      currency,
      stripePaymentId,
    });

    if (!bookingId || !userId || !amount || !currency || !stripePaymentId) {
      console.error("Missing required fields:", {
        bookingId,
        userId,
        amount,
        currency,
        stripePaymentId,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // Validate userId exists
    console.log("Validating userId:", { userId });
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) {
      console.error("User not found for _id:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate bookingId exists
    console.log("Validating bookingId:", { bookingId });
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
    });
    if (!booking) {
      console.error("Booking not found for bookingId:", bookingId);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const newPayment = {
      _id: new ObjectId(),
      bookingId: new ObjectId(bookingId), // Store as ObjectId
      userId, // Store as string
      amount: parseFloat(amount),
      currency,
      status: "completed",
      stripePaymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Attempting to save payment:", newPayment);
    const result = await db.collection("payments").insertOne(newPayment);
    console.log(`Payment saved for bookingId ${bookingId}:`, {
      paymentId: result.insertedId,
    });

    return NextResponse.json(
      { message: "Payment created", paymentId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving payment:", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Failed to save payment: ${error.message}` },
      { status: 500 }
    );
  }
}
