import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";

export async function getUserByFirebaseUid(firebaseUid) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db.collection("users").findOne({ firebaseUid });
}

export async function getUserById(userId) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db.collection("users").findOne({ _id: new ObjectId(userId) });
}

export async function getAllUsersByRole(role) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");
  return await db.collection("users").find({ role }).toArray();
}
