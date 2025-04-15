import { NextResponse } from "next/server";
import clientPromise from "../../utils/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const coaches = await db.collection("coaches").find({}).toArray();
    console.log(
      "Coaches fetched:",
      coaches.map((c) => ({ id: c._id.toString(), name: c.name }))
    );

    const sanitizedCoaches = coaches.map((coach) => ({
      _id: coach._id.toString(),
      name: coach.name || "Unknown Coach",
      specialty: coach.specialty || "Unknown",
      bio: coach.bio || "",
      availability: Array.isArray(coach.availability) ? coach.availability : [],
      rate: coach.rate || "0",
      rating: coach.rating || 0,
      userId: coach.userId || null,
    }));

    return NextResponse.json(sanitizedCoaches, { status: 200 });
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}
