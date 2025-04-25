import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function getBookingsForPlayer(playerId) {
  const client = await connectDB();
  const db = client.db("bayou-side-tennis");

  return await db
    .collection("bookings")
    .find({ playerId: new ObjectId(playerId) })
    .toArray();
}

export async function getBookingsForCoach(coachId) {
  const db = await connectDB();
  return await db
    .collection("bookings")
    .find({ coachId: new ObjectId(coachId) })
    .toArray();
}
