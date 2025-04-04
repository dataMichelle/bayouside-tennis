import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Add to .env.local

export async function POST(request) {
  try {
    const { bookingIds, amount, currency, description } = await request.json();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description,
            },
            unit_amount: amount, // In cents
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
    });
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
