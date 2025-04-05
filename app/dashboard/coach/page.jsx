"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { format, utcToZonedTime, parseISO, parse } from "date-fns-tz"; // Add parse

export default function CoachDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [fee, setFee] = useState("");
  const [coachName, setCoachName] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const coachId = user.uid;
        await fetchCoachData(coachId);
      } else {
        setError("Not authenticated");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCoachData = async (coachId) => {
    try {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).toISOString();

      const scheduleResponse = await fetch("/api/coach/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, startOfMonth, endOfMonth }),
      });
      const scheduleData = await scheduleResponse.json();
      if (scheduleResponse.ok) setSchedule(scheduleData.bookings);
      else throw new Error(scheduleData.error || "Failed to fetch schedule");

      const feeResponse = await fetch("/api/coach/fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      const feeData = await feeResponse.json();
      if (feeResponse.ok) {
        setFee(feeData.rate);
        setCoachName(feeData.name);
      } else if (feeResponse.status === 404) {
        setFee("Not set");
        setCoachName("Unknown Coach");
      } else throw new Error(feeData.error || "Failed to fetch fee");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = useCallback(async (info) => {
    const bookingId = info.event.id;
    try {
      const response = await fetch("/api/coach/booking-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedBooking(data);
      } else {
        throw new Error(data.error || "Failed to fetch booking details");
      }
    } catch (error) {
      alert("Failed to fetch booking details: " + error.message);
    }
  }, []);

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    const coachId = auth.currentUser.uid;
    const newFee = parseFloat(fee).toString();
    try {
      const response = await fetch("/api/coach/update-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, newFee }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update fee");
      alert("Fee updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const getCSTDateTime = (booking) => {
    const timeZone = "America/Chicago";
    let start, end;

    if (booking.startTime.includes("T")) {
      // Full ISO string (e.g., "2025-04-11T14:00:00.000Z")
      start = utcToZonedTime(parseISO(booking.startTime), timeZone);
      end = utcToZonedTime(parseISO(booking.endTime), timeZone);
    } else {
      // Time-only string (e.g., "10:00") with day (e.g., "Tuesday")
      const baseDate = new Date(2025, 3, 1); // April 2025 base for reference
      const dayIndex = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ].indexOf(booking.day);
      const daysToAdd = (dayIndex - baseDate.getDay() + 7) % 7;
      const eventDate = new Date(baseDate);
      eventDate.setDate(baseDate.getDate() + daysToAdd);

      start = utcToZonedTime(
        parse(`${eventDate.toISOString().split("T")[0]} ${booking.startTime}`, "yyyy-MM-dd HH:mm", new Date()),
        timeZone
      );
      end = utcToZonedTime(
        parse(`${eventDate.toISOString().split("T")[0]} ${booking.endTime}`, "yyyy-MM-dd HH:mm", new Date()),
        timeZone
      );
    }

    return { start, end };
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">
          Coach Dashboard - {coachName}
        </h1>

        <div className="bg-taupe-200 bg-opacity-80 border border-swamp-400 border-opacity-40 shadow-[0px_8px_16px_rgba(34,85,34,1)] p-6 rounded-lg">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Monthly Schedule</h2>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={schedule.map((booking) => {
                const { start, end } = getCSTDateTime(booking);
                return {
                  id: booking._id.toString(),
                  title: "Booking",
                  start,
                  end,
                  backgroundColor: "green",
                  borderColor: "green",
                };
              })}
              eventClick={handleEventClick}
              editable={false}
              selectable={true}
            />
            {selectedBooking && (
              <div className="mt-4 p-4 border rounded bg-gray-100 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                <h3 className="text-lg font-bold">Booking Details</h3>
                <p>Player: {selectedBooking.playerName}</p>
                <p>
                  Start:{" "}
                  {format(
                    getCSTDateTime(selectedBooking).start,
                    "yyyy-MM-dd HH:mm"
                  )}
                </p>
                <p>
                  End:{" "}
                  {format(
                    getCSTDateTime(selectedBooking).end,
                    "yyyy-MM-dd HH:mm"
                  )}
                </p>
                <p>Payment Status: {selectedBooking.paymentStatus}</p>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Update Coaching Fee</h2>
            <form onSubmit={handleFeeSubmit} className="space-y-4">
              <div>
                <label htmlFor="fee" className="block text-sm font-medium">
                  Hourly Fee ($)
                </label>
                <input
                  type="number"
                  id="fee"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Update Fee
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}