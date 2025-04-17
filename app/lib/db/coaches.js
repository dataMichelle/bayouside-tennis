import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

export async function getAllCoachProfiles() {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db.collection("coaches").find({}).toArray();
}

export async function getCoachProfileByUserId(userId) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db
    .collection("coaches")
    .findOne({ userId: new ObjectId(userId) });
}
