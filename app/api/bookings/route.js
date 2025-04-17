// app/api/bookings/route.js
import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    console.log("GET /api/bookings called with userId:", userId);

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    let bookings;
    if (userId) {
      // Validate userId as MongoDB _id
      if (!ObjectId.isValid(userId)) {
        console.error("Invalid userId format:", userId);
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
      }
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (!user) {
        console.error("User not found for _id:", userId);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      bookings = await db
        .collection("bookings")
        .find({ $or: [{ playerId: userId }, { coachId: userId }] })
        .toArray();
    } else {
      bookings = await db.collection("bookings").find({}).toArray();
    }
    console.log("Bookings fetched:", bookings.length);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/bookings error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("POST /api/bookings called with:", body);

    const { playerId, coachId, startTime, endTime, totalCost } = body;
    if (!playerId || !startTime || !endTime || !totalCost) {
      console.error("Missing required fields:", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate playerId and coachId as MongoDB _id
    if (!ObjectId.isValid(playerId)) {
      console.error("Invalid playerId format:", playerId);
      return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const player = await db
      .collection("users")
      .findOne({ _id: new ObjectId(playerId) });
    if (!player) {
      console.error("Player not found for _id:", playerId);
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    let coach = null;
    if (coachId) {
      if (!ObjectId.isValid(coachId)) {
        console.error("Invalid coachId format:", coachId);
        return NextResponse.json({ error: "Invalid coachId" }, { status: 400 });
      }
      coach = await db
        .collection("users")
        .findOne({ _id: new ObjectId(coachId) });
      if (!coach) {
        console.error("Coach not found for _id:", coachId);
        return NextResponse.json({ error: "Coach not found" }, { status: 404 });
      }
    }

    const newBooking = {
      _id: new ObjectId(),
      playerId,
      coachId: coachId || null,
      day:
        body.day ||
        new Date(startTime).toLocaleDateString("en-US", { weekday: "long" }),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "pending",
      ballMachine: body.ballMachine || false,
      totalCost: parseFloat(totalCost),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);
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
  }
}
