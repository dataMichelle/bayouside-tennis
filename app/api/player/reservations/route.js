// /app/api/player/reservations/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const bookings = await db
      .collection("bookings")
      .aggregate([
        {
          $match: { playerId },
        },
        {
          $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "bookingId",
            as: "payment",
          },
        },
        {
          $unwind: {
            path: "$payment",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "coaches",
            localField: "coachId",
            foreignField: "userId",
            as: "coach",
          },
        },
        {
          $unwind: {
            path: "$coach",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            day: 1,
            startTime: 1,
            endTime: 1,
            ballMachine: 1,
            totalCost: 1,
            status: 1,
            coachId: 1,
            playerId: 1,
            createdAt: 1,
            updatedAt: 1,
            payment: {
              amount: "$payment.amount",
              stripePaymentId: "$payment.stripePaymentId",
              status: "$payment.status",
            },
            coach: {
              name: "$coach.name",
              rate: "$coach.rate",
              specialty: "$coach.specialty",
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
