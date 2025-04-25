// app/api/payments/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const bookingIds = url.searchParams.getAll("bookingId");
    const parsedIds = bookingIds
      .filter((id) => id && id !== "null")
      .map((id) => new ObjectId(id));

    const client = await connectDB();
    const db = client.db("bayou-side-tennis");

    const payments = await db
      .collection("payments")
      .find({ bookingId: { $in: parsedIds } })
      .toArray();

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
