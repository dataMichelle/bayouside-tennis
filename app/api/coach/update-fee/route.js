import { connectDB } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { coachId, newFee } = await req.json();

    if (!coachId || newFee === undefined) {
      return new Response(
        JSON.stringify({ error: "coachId and newFee are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = await connectDB();

    const result = await db
      .collection("coaches")
      .updateOne({ userId: coachId }, { $set: { rate: newFee } });

    if (result.modifiedCount === 0) {
      throw new Error("Fee update failed or no change made.");
    }

    return new Response(JSON.stringify({ message: "Fee updated" }), {
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
