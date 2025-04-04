import clientPromise from "../../../utils/mongodb";

export async function POST(req) {
  try {
    const { coachId, newFee } = await req.json();
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    const result = await db
      .collection("coaches")
      .updateOne({ userId: coachId }, { $set: { rate: newFee } });
    if (result.modifiedCount === 0) throw new Error("Fee update failed");
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
