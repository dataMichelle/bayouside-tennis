import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Ensure the connection is handled via connectDB()
import { ObjectId } from "mongodb";

export async function GET(_, { params }) {
  const client = await connectDB();
  const db = client.db("bayou-side-tennis");
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(params.uid) });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ role: user.role }, { status: 200 });
}
