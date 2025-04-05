"use client";

import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function PlayerDashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [coaches, setCoaches] = useState([]); // Add coaches for name lookup
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const [bookingsResponse, coachesResponse] = await Promise.all([
            fetch(`/api/bookings?userId=${currentUser.uid}`),
            fetch("/api/coach"),
          ]);
          if (!bookingsResponse.ok) throw new Error("Failed to fetch bookings");
          if (!coachesResponse.ok) throw new Error("Failed to fetch coaches");
          const bookingsData = await bookingsResponse.json();
          const coachesData = await coachesResponse.json();

          const upcomingBookings = bookingsData
            .filter((booking) => new Date(booking.startTime) > new Date())
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

          setBookings(upcomingBookings);
          setCoaches(coachesData);
        } catch (err) {
          setError(err.message);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (!user)
    return (
      <div className="text-center p-6">
        Please log in to view your dashboard.
      </div>
    );
  if (error)
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        Player Dashboard
      </h1>
      <div className="bg-swamp-200 dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">
          Upcoming Reservations
        </h2>
        {bookings.length > 0 ? (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking._id} className="border-b pb-2">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(booking.startTime).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {formatTimeTo12HourCDT(booking.startTime)} -{" "}
                  {formatTimeTo12HourCDT(booking.endTime)} CDT
                </p>
                <p>
                  <strong>Coach:</strong>{" "}
                  {coaches.find((c) => c._id === booking.coachId)?.name ||
                    "No Coach"}
                </p>
                <p>
                  <strong>Ball Machine:</strong>{" "}
                  {booking.ballMachine ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Cost:</strong> $
                  {booking.totalCost !== undefined
                    ? booking.totalCost.toFixed(2)
                    : "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {booking.status}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutrals-600 dark:text-neutrals-300">
            No upcoming reservations.
          </p>
        )}
      </div>
    </main>
  );
}
