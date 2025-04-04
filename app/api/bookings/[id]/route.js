import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  let client;
  try {
    const { id } = params;
    const { status } = await request.json();
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const result = await db
      .collection("bookings")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );
    if (result.modifiedCount === 0)
      throw new Error("Booking not found or not updated");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update booking", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
