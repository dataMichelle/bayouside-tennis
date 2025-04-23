"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CoachDashboard() {
  const [coachName, setCoachName] = useState("");
  const [fee, setFee] = useState("");
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId: user.uid }),
        });
        const data = await res.json();
        if (res.ok) {
          setCoachName(data.name);
          setFee(data.rate);
          setBookings(data.bookings || []);
          setPayments((data.payments || []).slice(0, 5));
          const income = data.payments
            ? data.payments.reduce(
                (sum, payment) => sum + (payment.coachFee || 0),
                0
              )
            : 0;
          setTotalIncome(income);
        } else {
          throw new Error(data.error || "Failed to fetch coach data");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      timeZone: "America/Chicago",
    });
  };

  const formatUSD = (amount) => {
    if (!amount && amount !== 0) return "-";
    return `$${amount.toFixed(2)}`;
  };

  if (loading)
    return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className=" text-red-600">Error: {error}</div>;

  return (
    <ProtectedRoute allowedRoles={["coach", "owner"]} redirectTo="/auth/login">
      <main>
        <DashboardHeader title={`Welcome, ${coachName || "Coach"}`} />

        <div className="max-w-4xl mx-auto my-6 flex flex-col sm:flex-row gap-4">
          <div className="bg-swamp-200 p-4 rounded-lg shadow-md flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Income
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatUSD(totalIncome)}
            </p>
          </div>
          <div className="bg-swamp-200 p-4 rounded-lg shadow-md flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              Current Hourly Rate
            </h3>
            <p className="text-2xl font-bold text-gray-900">${fee}/hr</p>
          </div>
        </div>

        <section className="max-w-4xl mx-auto mt-6">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">
            Upcoming Reservations
          </h2>
          {bookings.length === 0 ? (
            <p className="text-gray-600 text-center">
              No upcoming bookings found.
            </p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-4 rounded-lg shadow border border-gray-200"
                >
                  <div>
                    <strong>Date:</strong> {formatDate(booking.startTime)}
                  </div>
                  <div>
                    <strong>Time:</strong> {booking.bookingTime || "-"}
                  </div>
                  <div>
                    <strong>Player:</strong> {booking.playerName || "Unknown"}
                  </div>
                  <div>
                    <strong>Status:</strong> {booking.status || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
