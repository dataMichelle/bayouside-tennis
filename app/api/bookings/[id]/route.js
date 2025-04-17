import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!id || !status) {
      console.error("Missing id or status:", { id, status });
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const result = await db
      .collection("bookings")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );

    if (result.matchedCount === 0) {
      console.warn("Booking not found:", id);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (result.modifiedCount === 0) {
      console.warn("Booking not updated:", id, "Current status:", status);
      return NextResponse.json(
        { error: "Booking not updated" },
        { status: 400 }
      );
    }

    console.log(`Booking ${id} updated to status: ${status}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking", details: error.message },
      { status: 500 }
    );
  }
}
