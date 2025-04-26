"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import DashboardHeader from "@/components/DashboardHeader";
import { formatInTimeZone, toDate } from "date-fns-tz";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function OwnerSchedulePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/owner/schedule");
        if (!res.ok) throw new Error("Failed to load schedule");
        const data = await res.json();

        // Convert UTC times to CDT ISO strings
        const formattedEvents = data.map((event) => {
          const startCDT = formatInTimeZone(
            toDate(event.start),
            "America/Chicago",
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          );
          const endCDT = formatInTimeZone(
            toDate(event.end),
            "America/Chicago",
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          );

          return {
            ...event,
            start: startCDT,
            end: endCDT,
            backgroundColor: event.ballMachine ? "#FF6B6B" : "#4A90E2", // Red for ball machine, blue for others
            borderColor: event.ballMachine ? "#FF6B6B" : "#4A90E2",
          };
        });

        setEvents(formattedEvents);
      } catch (err) {
        console.error(
          "OwnerSchedulePage - Error fetching schedule:",
          err.message
        );
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  if (loading)
    return <div className="p-6 text-gray-600">Loading schedule...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <ProtectedRoute allowedRoles={["coach", "owner"]} redirectTo="/auth/login">
      <main className="p-6">
        <DashboardHeader />
        <FullCalendar
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          slotMinTime="06:00:00"
          slotMaxTime="21:00:00"
          events={events}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
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
      </main>
    </ProtectedRoute>
  );
}
