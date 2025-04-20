import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const { coachId } = await req.json(); // This is the Firebase UID
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    // First find the user by firebaseUid
    const user = await db.collection("users").findOne({ firebaseUid: coachId });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Then find the coach by that user's _id
    const coach = await db
      .collection("coaches")
      .findOne({ userId: user._id.toString() });
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
