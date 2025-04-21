import { NextResponse } from "next/server";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingIds, amount, description, userId } = body;
    console.log("Stripe checkout request:", {
      bookingIds,
      amount,
      description,
      userId,
    });

    // Validate inputs
    if (!Array.isArray(bookingIds)) {
      console.error("Invalid bookingIds: not an array");
      return NextResponse.json(
        { error: "Booking IDs must be an array" },
        { status: 400 }
      );
    }

    const sanitizedIds = bookingIds.filter(
      (id) => typeof id === "string" && id.trim() !== ""
    );
    if (sanitizedIds.length === 0) {
      console.error("No valid booking IDs provided");
      return NextResponse.json(
        { error: "No valid booking IDs provided" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      console.error("Invalid amount:", amount);
      return NextResponse.json(
        { error: "Invalid amount: must be a positive number" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string") {
      console.error("Invalid description:", description);
      return NextResponse.json(
        { error: "Invalid description: must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      console.error("Invalid userId:", userId);
      return NextResponse.json(
        { error: "Invalid userId: must be a non-empty string" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    console.log("Using base URL:", baseUrl);

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: description },
            unit_amount: Math.round(amount * 100), // Ensure integer cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        bookingIds: JSON.stringify(sanitizedIds),
        userId,
        totalCost: amount.toString(),
      },
      success_url: `${baseUrl}/players/reservations?success=true&bookingIds=${encodeURIComponent(
        JSON.stringify(sanitizedIds)
      )}&totalCost=${amount}`,
      cancel_url: `${baseUrl}/players/reservations`,
    });

    // Update bookings with session ID
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const updateResult = await db
      .collection("bookings")
      .updateMany(
        { _id: { $in: sanitizedIds.map((id) => new ObjectId(id)) } },
        { $set: { stripeSessionId: session.id } }
      );
    console.log("Booking update result:", updateResult);

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error.message, error.stack);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
}
