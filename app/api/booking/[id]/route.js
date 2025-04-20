import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, context) {
  try {
    // Await params to fix Next.js error
    const { id } = await context.params;
    const { status } = await request.json();

    console.log("PATCH /api/booking/[id] called:", { id, status });

    if (!id || !status) {
      console.error("Missing required fields:", { id, status });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // If status is "confirmed", verify payment exists
    if (status === "confirmed") {
      console.log("Checking for payment for bookingId:", { id });
      const payment = await db
        .collection("payments")
        .findOne({ bookingId: id.toString() });
      if (!payment) {
        console.error("No payment found for bookingId:", { id });
        return NextResponse.json(
          { error: "Cannot confirm booking without payment" },
          { status: 400 }
        );
      }
      console.log("Payment verified:", {
        paymentId: payment._id,
        bookingId: id,
      });
    }

    console.log("Updating booking status:", { id, status });
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      console.error("Booking not found:", { id });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    console.log("Booking updated successfully:", {
      id,
      status,
      modifiedCount: result.modifiedCount,
    });

    return NextResponse.json({ message: "Booking updated" }, { status: 200 });
  } catch (error) {
    console.error("Error updating booking:", {
      id: context.params?.id,
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
