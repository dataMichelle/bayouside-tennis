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
    const bookingIds = bookings.map((b) => b._id.toString());
    const payments = await db
      .collection("payments")
      .find({ bookingId: { $in: bookingIds } })
      .toArray();
    return new Response(JSON.stringify({ payments }), {
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
