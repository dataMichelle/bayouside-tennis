// app/dashboard/owner/schedule/page.jsx

"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import DashboardHeader from "@/components/DashboardHeader";

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
        setEvents(data);
      } catch (err) {
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
    <main className="p-6">
      <DashboardHeader title="Court Schedule" />
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
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
      />
    </main>
  );
}
