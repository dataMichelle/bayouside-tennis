import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET() {
  try {
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const payments = await db.collection("payments").find().toArray();
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request) {
  try {
    const { bookingId, userId, amount, currency, stripePaymentId } =
      await request.json();

    await client.connect();
    const db = client.db("bayou-side-tennis");

    const newPayment = {
      _id: new ObjectId(),
      bookingId: new ObjectId(bookingId),
      userId: new ObjectId(userId),
      amount: parseInt(amount), // Int32
      currency,
      status: "pending",
      stripePaymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("payments").insertOne(newPayment);
    return NextResponse.json(
      { message: "Payment created", paymentId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
