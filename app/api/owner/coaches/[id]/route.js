// app/api/owner/coaches/[id]/route.js

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const id = params.id;
    const updates = await request.json();

    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const updateFields = {};
    if (typeof updates.name === "string") updateFields.name = updates.name;
    if (typeof updates.bio === "string") updateFields.bio = updates.bio;
    if (typeof updates.rate === "string") updateFields.rate = updates.rate;
    if (Array.isArray(updates.specialty))
      updateFields.specialty = updates.specialty;
    if (Array.isArray(updates.availability))
      updateFields.availability = updates.availability;

    const result = await db
      .collection("coaches")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Coach not found or no changes made" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/owner/coaches/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update coach" },
      { status: 500 }
    );
  }
}
