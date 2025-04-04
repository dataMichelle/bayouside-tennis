import clientPromise from "../../../utils/mongodb"; // Adjusted path

export async function POST(req) {
  try {
    const { coachId, startOfMonth, endOfMonth } = await req.json();
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const bookings = await db
      .collection("bookings")
      .find({
        coachId,
        startTime: { $gte: new Date(startOfMonth), $lte: new Date(endOfMonth) },
      })
      .toArray();
    return new Response(JSON.stringify({ bookings }), {
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
