// app/api/coach/schedule/route.js
import clientPromise from "../../../utils/mongodb";

export async function POST(req) {
  try {
    const { coachId, startOfMonth, endOfMonth } = await req.json();
    console.log("Schedule query:", { coachId, startOfMonth, endOfMonth });

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const bookings = await db
      .collection("bookings")
      .find({
        coachId,
        startTime: { $gte: startOfMonth, $lte: endOfMonth }, // Use strings as-is
      })
      .toArray();

    console.log(
      "Fetched bookings for coachId:",
      coachId,
      "Bookings:",
      JSON.stringify(bookings, null, 2)
    );
    return new Response(JSON.stringify({ bookings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Schedule fetch error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
