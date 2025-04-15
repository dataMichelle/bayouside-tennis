import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { bookingIds, userId, amount, currency, description } =
      await request.json();

    if (
      !bookingIds ||
      !Array.isArray(bookingIds) ||
      !userId ||
      !amount ||
      !currency ||
      !description
    ) {
      console.error("Missing required fields:", {
        bookingIds,
        userId,
        amount,
        currency,
        description,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get(
        "origin"
      )}/booking?success=true&bookingIds=${encodeURIComponent(
        JSON.stringify(bookingIds)
      )}`,
      cancel_url: `${request.headers.get("origin")}/booking?success=false`,
      metadata: {
        bookingIds: JSON.stringify(bookingIds),
        userId,
      },
    });

    console.log("Stripe session created:", session.id, bookingIds);
    return NextResponse.json({ sessionId: session.id }, { status: 200 });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
