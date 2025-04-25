import { connectDB } from "../mongodb";
import { ObjectId } from "mongodb";

export async function getUserByFirebaseUid(firebaseUid) {
  const db = await connectDB();
  return await db.collection("users").findOne({ firebaseUid });
}

export async function getUserById(userId) {
  const db = await connectDB();
  return await db.collection("users").findOne({ _id: new ObjectId(userId) });
}

export async function getAllUsersByRole(role) {
  const db = await connectDB();
  return await db.collection("users").find({ role }).toArray();
}
