// app/dashboard/coach/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CoachDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [fee, setFee] = useState("");
  const [coachName, setCoachName] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Local timezone:", new Date().toString());
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const coachId = user.uid;
        console.log("CoachDashboard - Starting fetch for coachId:", coachId);
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
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const startISO = startOfMonth.toISOString();
      const endISO = endOfMonth.toISOString();

      console.log(
        "Fetching schedule for coachId:",
        coachId,
        "from",
        startISO,
        "to",
        endISO
      );

      const scheduleResponse = await fetch("/api/coach/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          startOfMonth: startISO,
          endOfMonth: endISO,
        }),
      });
      const scheduleData = await scheduleResponse.json();
      if (scheduleResponse.ok) {
        console.log(
          "Coach schedule:",
          JSON.stringify(scheduleData.bookings, null, 2)
        );
        setSchedule(scheduleData.bookings);
      } else throw new Error(scheduleData.error || "Failed to fetch schedule");

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
      console.error("Fetch error:", err.message);
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

  const formatTimeTo12HourCDT = (time) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    });
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
            <h2 className="text-2xl font-semibold mb-4">Weekly Schedule</h2>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="timeGridWeek"
              initialDate="2025-04-07"
              timeZone="America/Chicago" // Use CDT directly
              slotMinTime="06:00:00"
              slotMaxTime="21:00:00"
              slotDuration="01:00:00"
              slotLabelInterval="01:00"
              height="auto"
              contentHeight="auto"
              expandRows={false}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
                timeZone: "America/Chicago",
              }}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={schedule.map((booking) => {
                // Convert UTC to local CDT (subtract 5 hours)
                const startCDT = new Date(booking.startTime);
                startCDT.setHours(startCDT.getHours() - 5);
                const endCDT = new Date(booking.endTime);
                endCDT.setHours(endCDT.getHours() - 5);
                const event = {
                  id: booking._id.toString(),
                  title: booking.coachId ? "Coaching" : "Court Booking",
                  start: startCDT.toISOString(), // "2025-04-10T10:00:00.000Z" -> "2025-04-10T10:00:00.000Z"
                  end: endCDT.toISOString(), // "2025-04-10T11:00:00.000Z" -> "2025-04-10T11:00:00.000Z"
                  backgroundColor: booking.coachId ? "green" : "blue",
                  borderColor: booking.coachId ? "green" : "blue",
                };
                console.log(
                  "Event for FullCalendar:",
                  JSON.stringify(event, null, 2)
                );
                return event;
              })}
              eventClick={handleEventClick}
              editable={false}
              selectable={true}
              eventDidMount={(info) => {
                console.log("Event rendered:", {
                  id: info.event.id,
                  start: info.event.start.toISOString(),
                  end: info.event.end.toISOString(),
                  displayDate: info.event.start.toLocaleDateString("en-US", {
                    timeZone: "America/Chicago",
                  }),
                  displayTime: info.event.start.toLocaleTimeString("en-US", {
                    timeZone: "America/Chicago",
                    hour12: true,
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                  displayEndTime: info.event.end.toLocaleTimeString("en-US", {
                    timeZone: "America/Chicago",
                    hour12: true,
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                });
              }}
            />
            {selectedBooking && (
              <div className="mt-4 p-4 border rounded bg-gray-100 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                <h3 className="text-lg font-bold">Booking Details</h3>
                <p>Player: {selectedBooking.playerName}</p>
                <p>Start: {formatTimeTo12HourCDT(selectedBooking.startTime)}</p>
                <p>End: {formatTimeTo12HourCDT(selectedBooking.endTime)}</p>
                <p>Payment Status: {selectedBooking.status}</p>
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
