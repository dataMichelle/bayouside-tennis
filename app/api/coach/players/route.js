import { ObjectId } from "mongodb";
import clientPromise from "../../../utils/mongodb";

export async function POST(req) {
  try {
    const { coachId } = await req.json();
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const bookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();
    const playerIds = [...new Set(bookings.map((b) => b.userId))];
    const playersData = await db
      .collection("users")
      .find({ _id: { $in: playerIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const players = await Promise.all(
      playersData.map(async (player) => {
        const booking = bookings.find(
          (b) => b.userId === player._id.toString()
        );
        const payment = await db
          .collection("payments")
          .findOne({ bookingId: booking._id.toString() });
        return {
          _id: player._id.toString(),
          name: player.name,
          email: player.email,
          phone: player.phone,
          paymentStatus: payment ? payment.status : "Pending",
        };
      })
    );
    return new Response(JSON.stringify({ players }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
