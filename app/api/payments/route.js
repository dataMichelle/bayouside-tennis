import { NextResponse } from "next/server";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const payments = await db.collection("payments").find().toArray();
    console.log("Payments fetched:", payments.length);
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
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

    if (!bookingId || !userId || !amount || !currency) {
      console.error("Missing required fields:", {
        bookingId,
        userId,
        amount,
        currency,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const newPayment = {
      _id: new ObjectId(),
      bookingId: new ObjectId(bookingId),
      userId,
      amount: parseInt(amount),
      currency,
      status: "completed",
      stripePaymentId: stripePaymentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("payments").insertOne(newPayment);
    console.log(`Payment saved for bookingId ${bookingId}:`, newPayment);

    return NextResponse.json(
      { message: "Payment created", paymentId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving payment:", error);
    return NextResponse.json(
      { error: `Failed to save payment: ${error.message}` },
      { status: 500 }
    );
  }
}
