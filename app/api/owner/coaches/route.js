import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await connectDB();

    const coaches = await db.collection("coaches").find({}).toArray();
    const userIds = coaches
      .map((coach) => coach.userId)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds } })
      .project({ name: 1, phone: 1, email: 1 })
      .toArray();

    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const merged = coaches.map((coach) => {
      const user = userMap[coach.userId] || {};
      return {
        ...coach,
        phone: user.phone || null,
        email: user.email || null,
        name: user.name || coach.name || "Unnamed Coach",
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("GET /api/owner/coaches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}
