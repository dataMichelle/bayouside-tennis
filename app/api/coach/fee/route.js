import clientPromise from "../../../utils/mongodb";

export async function POST(req) {
  try {
    const { coachId } = await req.json();
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const coach = await db.collection("coaches").findOne({ userId: coachId });
    if (!coach) {
      return new Response(JSON.stringify({ error: "Coach not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ rate: coach.rate, name: coach.name }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
