"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { format, toDate } from "date-fns";
import * as tz from "date-fns-tz";

const { utcToZonedTime, formatInTimeZone } = tz;

export default function CoachSchedulePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const startISO = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
        const endISO = new Date(
          now.getFullYear(),
          now.getMonth() + 2,
          0
        ).toISOString();

        const res = await fetch("/api/coach/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId: user.uid,
            startOfMonth: startISO,
            endOfMonth: endISO,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch schedule");

        const formatted = data.bookings.map((booking) => {
          const startCDT = formatInTimeZone(
            toDate(booking.startTime),
            "America/Chicago",
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          );
          const endCDT = formatInTimeZone(
            toDate(booking.endTime),
            "America/Chicago",
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          );
          return {
            id: booking._id,
            title: booking.coachId
              ? `Coaching: ${booking.playerName || "Unknown"}`
              : "Court Booking",
            start: startCDT,
            end: endCDT,
            backgroundColor: booking.coachId ? "green" : "blue",
            borderColor: booking.coachId ? "green" : "blue",
          };
        });

        setEvents(formatted);
      } catch (err) {
        console.error(
          "CoachSchedulePage - Error fetching schedule:",
          err.message
        );
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEventClick = useCallback(async (info) => {
    try {
      const response = await fetch("/api/coach/booking-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: info.event.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedBooking(data);
      } else {
        throw new Error(data.error || "Failed to fetch booking");
      }
    } catch (err) {
      console.error("CoachSchedulePage - Event click error:", err.message);
    }
  }, []);

  const formatDateTimeToCDT = (utcDate) => {
    if (!utcDate) return "";
    const zonedDate = utcToZonedTime(toDate(utcDate), "America/Chicago");
    return format(zonedDate, "M/d/yyyy h:mm a");
  };

  return (
    <main className="p-6">
      <DashboardHeader title="My Weekly Schedule" />

      {loading && <p className="text-gray-600">Loading calendar...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <FullCalendar
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          timeZone="America/Chicago"
          slotMinTime="06:00:00"
          slotMaxTime="21:00:00"
          events={events}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
          eventClick={handleEventClick}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
        />
      )}

      {selectedBooking && (
        <div className="mt-4 p-4 border rounded bg-gray-100 shadow fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
          <h3 className="text-lg font-bold mb-2">Booking Details</h3>
          <p>
            <strong>Player:</strong> {selectedBooking.playerName || "Unknown"}
          </p>
          <p>
            <strong>Start:</strong>{" "}
            {formatDateTimeToCDT(selectedBooking.startTime)}
          </p>
          <p>
            <strong>End:</strong> {formatDateTimeToCDT(selectedBooking.endTime)}
          </p>
          <p>
            <strong>Status:</strong> {selectedBooking.status}
          </p>
          <button
            onClick={() => setSelectedBooking(null)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      )}
    </main>
  );
}
