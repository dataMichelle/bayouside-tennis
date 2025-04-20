import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(request) {
  try {
    const { bookingIds, userId, amount, currency, description } =
      await request.json();

    console.log("Stripe checkout POST received:", {
      bookingIds,
      userId,
      amount,
      currency,
      description,
      requestOrigin: request.headers.get("origin"),
    });

    if (
      !bookingIds ||
      !Array.isArray(bookingIds) ||
      bookingIds.length === 0 ||
      !userId ||
      !amount ||
      amount <= 0 ||
      !currency ||
      !description
    ) {
      console.error("Missing or invalid required fields:", {
        bookingIds,
        userId,
        amount,
        currency,
        description,
      });
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get(
        "origin"
      )}/players/reservations?success=true&bookingIds=${encodeURIComponent(
        JSON.stringify(bookingIds)
      )}&totalCost=${amount}`,
      cancel_url: `${request.headers.get("origin")}/booking?success=false`,
      metadata: {
        bookingIds: JSON.stringify(bookingIds),
        userId,
        totalCost: amount.toString(),
      },
    });

    console.log("Stripe.session created:", {
      sessionId: session.id,
      bookingIds,
      userId,
      successUrl: session.success_url,
      cancelUrl: session.cancel_url,
      status: session.status,
      paymentStatus: session.payment_status,
    });

    return NextResponse.json(
      { sessionId: session.id, url: session.url },
      { status: 200 }
    );
  } catch (error) {
    console.error("Stripe checkout error:", {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe checkout session" },
      { status: 500 }
    );
  }
}