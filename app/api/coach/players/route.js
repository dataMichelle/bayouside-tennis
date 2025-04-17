import { NextResponse } from "next/server";
import { getPlayersForCoach } from "@/lib/mongodb-queries";

export async function POST(request) {
  try {
    const body = await request.json();
    const coachId = body.coachId;

    console.log("📬 Received POST /api/coach/players with:", coachId);

    if (!coachId) {
      return NextResponse.json(
        { error: "Coach ID is required" },
        { status: 400 }
      );
    }

    const players = await getPlayersForCoach(coachId);
    console.log("✅ Players returned:", players.length);

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("❌ API /coach/players error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch players" },
      { status: 500 }
    );
  }
}
