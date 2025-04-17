import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(_, { params }) {
  const client = await clientPromise;
  const db = client.db("bayou-side-tennis");

  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(params.uid) });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ role: user.role }, { status: 200 });
}
