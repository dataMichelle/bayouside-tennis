import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function getAllCoachProfiles() {
  const client = await connectDB();
  const db = client.db("bayou-side-tennis");
  return await db.collection("coaches").find({}).toArray();
}

export async function getCoachProfileByUserId(userId) {
  const client = await connectDB();
  const db = client.db("bayou-side-tennis");
  return await db
    .collection("coaches")
    .findOne({ userId: new ObjectId(userId) });
}
