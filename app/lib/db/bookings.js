import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

export async function getBookingsForPlayer(playerId) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db
    .collection("bookings")
    .find({ playerId: new ObjectId(playerId) })
    .toArray();
}

export async function getBookingsForCoach(coachId) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db
    .collection("bookings")
    .find({ coachId: new ObjectId(coachId) })
    .toArray();
}
