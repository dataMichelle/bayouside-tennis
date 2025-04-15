import { NextResponse } from "next/server";
import { getPlayersForCoach } from "../../utils/mongodb-queries";

export async function POST(request) {
  try {
    const { coachId } = await request.json();
    if (!coachId) {
      return NextResponse.json(
        { error: "Coach ID is required" },
        { status: 400 }
      );
    }
    const players = await getPlayersForCoach(coachId);
    console.log(`Players for coachId ${coachId}:`, players);
    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
