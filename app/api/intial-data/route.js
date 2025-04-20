import { NextResponse } from "next/server";
import {
  getAllCoaches,
  getAllBookings,
  getSettings,
} from "@/lib/mongodb-queries";

export async function GET() {
  try {
    const [coachesData, bookingsData, settingsData] = await Promise.all([
      getAllCoaches(),
      getAllBookings(),
      getSettings(),
    ]);
    return NextResponse.json(
      {
        coaches: coachesData,
        bookings: bookingsData,
        settings: settingsData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch initial data", details: error.message },
      { status: 500 }
    );
  }
}
