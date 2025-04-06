// app/api/bookings/route.js
import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  let client;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    console.log("GET /api/bookings called with userId:", userId);

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");

    let bookings;
    if (userId) {
      // Query for both playerId and userId to handle inconsistency
      bookings = await db
        .collection("bookings")
        .find({
          $or: [{ playerId: userId }, { userId: userId }],
        })
        .toArray();
    } else {
      bookings = await db.collection("bookings").find({}).toArray();
    }
    console.log("Bookings fetched:", bookings);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/bookings error:", error.message);
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
    console.log("POST /api/bookings called with:", body);
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("bayou-side-tennis");
    const result = await db.collection("bookings").insertOne(body);
    console.log("Booking inserted:", result.insertedId);
    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error.message);
    return NextResponse.json(
      { error: "Failed to save booking", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
