import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { calculateCostBreakdown } from "@/utils/cost";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      playerId,
      coachId,
      startTime,
      endTime,
      ballMachine = false,
      slots,
      totalCost: clientTotalCost,
    } = body;

    // Validate required fields
    if (
      !playerId ||
      !slots ||
      !startTime ||
      !endTime ||
      !Array.isArray(slots) ||
      slots.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required booking fields." },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const coach = coachId
      ? await db.collection("coaches").findOne({ userId: coachId })
      : null;
    const settings = await db.collection("settings").findOne({});

    if (!settings) {
      return NextResponse.json(
        { error: "Settings not found." },
        { status: 404 }
      );
    }

    // Calculate cost using shared function
    const cost = calculateCostBreakdown({
      slots,
      coach,
      settings,
      ballMachine,
    });

    // Validate client-provided totalCost
    if (clientTotalCost !== undefined) {
      const tolerance = 0.01;
      if (Math.abs(clientTotalCost - cost.total) > tolerance) {
        console.error("Cost mismatch:", {
          clientTotalCost,
          serverTotal: cost.total,
          cost,
        });
        return NextResponse.json(
          {
            error: "Total cost mismatch between client and server.",
            details: cost,
          },
          { status: 400 }
        );
      }
    }

    const newBooking = {
      _id: new ObjectId(),
      playerId,
      coachId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      day: new Date(startTime).toLocaleDateString("en-US", {
        timeZone: "America/Chicago",
      }),
      totalCost: cost.total,
      costBreakdown: {
        coachFee: cost.coachFee,
        courtFee: cost.courtFee,
        machineFee: cost.machineFee,
      },
      ballMachine,
      status: "pending",
      slots,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        id: newBooking._id.toString(),
      });
    } else {
      throw new Error("Failed to insert the booking.");
    }
  } catch (error) {
    console.error("Booking POST error:", error);
    return NextResponse.json(
      { error: "Failed to create booking.", details: error.message },
      { status: 500 }
    );
  }
}
