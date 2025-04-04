"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
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

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">
          Coach Dashboard - {coachName}
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Monthly Schedule</h2>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={schedule.map((booking) => ({
              id: booking._id.toString(),
              title: "Booking",
              start: booking.startTime,
              end: booking.endTime,
              backgroundColor: "green",
              borderColor: "green",
            }))}
            eventClick={handleEventClick}
            editable={false}
            selectable={true}
          />
          {selectedBooking && (
            <div className="mt-4 p-4 border rounded bg-gray-100 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <h3 className="text-lg font-bold">Booking Details</h3>
              <p>Player: {selectedBooking.playerName}</p>
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
      </main>
    </div>
  );
}
