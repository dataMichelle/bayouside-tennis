import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  let client;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const bookings = await db
      .collection("bookings")
      .find({ coachId: null })
      .toArray();
    // Placeholder: Return sample slots for "No Coach"
    const availableSlots = [
      { day: "Monday", startTime: "10:00", endTime: "11:00" },
      { day: "Tuesday", startTime: "14:00", endTime: "15:00" },
    ];
    return NextResponse.json(availableSlots); // Replace with real logic
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const result = await db.collection("bookings").insertOne(body);
    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save booking", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
