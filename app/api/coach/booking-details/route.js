import { ObjectId } from "mongodb";
import clientPromise from "../../../utils/mongodb";

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const booking = await db
      .collection("bookings")
      .findOne({ _id: new ObjectId(bookingId) });
    if (!booking) throw new Error("Booking not found");

    const player = await db
      .collection("users")
      .findOne({ _id: new ObjectId(booking.userId) });
    if (!player) throw new Error("Player not found");

    const payment = await db.collection("payments").findOne({ bookingId });

    return new Response(
      JSON.stringify({
        playerName: player.name,
        paymentStatus: payment ? payment.status : "Pending",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
