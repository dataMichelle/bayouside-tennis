"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatInTimeZone, toDate } from "date-fns-tz";

export default function OwnerDashboard() {
  const [data, setData] = useState({
    coaches: [],
    payments: [],
    settings: {},
    reservations: [],
    totalRevenue: 0,
    pendingPayments: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("OwnerDashboard - Fetching dashboard data");
        const res = await fetch("/api/owner/dashboard");
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to fetch dashboard data: ${res.status} ${errorText}`
          );
        }
        const result = await res.json();
        console.log("OwnerDashboard - Data fetched:", result);
        setData(result);
      } catch (err) {
        console.error("OwnerDashboard - Error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatDateTimeToCDT = (utcDate) => {
    if (!utcDate) return "N/A";
    try {
      return formatInTimeZone(
        toDate(utcDate),
        "America/Chicago",
        "M/d/yyyy, h:mm a"
      );
    } catch (err) {
      console.error("formatDateTimeToCDT error:", err.message);
      return "Invalid date";
    }
  };

  const formatDateToCDT = (utcDate) => {
    if (!utcDate) return "N/A";
    try {
      return formatInTimeZone(toDate(utcDate), "America/Chicago", "M/d/yyyy");
    } catch (err) {
      console.error("formatDateToCDT error:", err.message);
      return "Invalid date";
    }
  };

  const formatTimeToCDT = (utcDate) => {
    if (!utcDate) return "N/A";
    try {
      return formatInTimeZone(toDate(utcDate), "America/Chicago", "h:mm a");
    } catch (err) {
      console.error("formatTimeToCDT error:", err.message);
      return "Invalid time";
    }
  };

  const formatRate = (rate) => {
    const numericRate = typeof rate === "string" ? parseFloat(rate) : rate;
    return isNaN(numericRate) ? "0.00" : numericRate.toFixed(2);
  };

  if (loading)
    return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="">
      <div className="space-y-6">
        {/* Upcoming Reservations - Full Width */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold text-swamp-700 mb-2">
            Upcoming Reservations
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Total This Week: {data.totalBookings}
          </p>
          {data.reservations.length === 0 ? (
            <p className="text-gray-600">No upcoming reservations.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Player</th>
                  <th className="text-left py-2">Coach</th>
                </tr>
              </thead>
              <tbody>
                {data.reservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-swamp-100">
                    <td className="py-2">
                      {formatDateToCDT(reservation.startTime)}
                    </td>
                    <td className="py-2">
                      {formatTimeToCDT(reservation.startTime)} -{" "}
                      {formatTimeToCDT(reservation.endTime)} CDT
                    </td>
                    <td className="py-2">
                      {reservation.playerName || "Unknown"}
                    </td>
                    <td className="py-2">
                      {reservation.coachName || "No Coach"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Other Cards - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Coaches Summary */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold text-swamp-700 mb-2">Coaches</h2>
            {data.coaches.length === 0 ? (
              <p className="text-gray-600">No coaches found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Rate</th>
                    <th className="text-left py-2">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coaches.map((coach) => (
                    <tr key={coach._id} className="hover:bg-swamp-100">
                      <td className="py-2">{coach.name || "Unknown"}</td>
                      <td className="py-2">${formatRate(coach.rate)}/hr</td>
                      <td className="py-2">{coach.weeklyBookings || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payments Summary */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold text-swamp-700 mb-2">Payments</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Total Revenue (30 Days): ${(data.totalRevenue / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Pending Payments: {data.pendingPayments}
              </p>
            </div>
            {data.payments.length === 0 ? (
              <p className="text-gray-600">No recent payments.</p>
            ) : (
              <ul className="text-sm">
                {data.payments.map((payment) => (
                  <li
                    key={payment._id}
                    className={`mb-2 ${
                      payment.status === "completed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Booking {payment.bookingId.slice(0, 6)}... | $
                    {(payment.amount / 100).toFixed(2)} |{" "}
                    {formatDateTimeToCDT(payment.createdAt)} | {payment.status}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rental Settings */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold text-swamp-700 mb-2">
              Rental Settings
            </h2>
            {data.settings ? (
              <>
                <p className="text-sm text-gray-600">
                  Court Rental: $
                  {(data.settings.courtRentalCost || 0).toFixed(2)}
                  /hr
                </p>
                <p className="text-sm text-gray-600">
                  Ball Machine: $
                  {(data.settings.ballMachineCost || 0).toFixed(2)}
                  /hr
                </p>
                <p className="text-sm text-gray-600">
                  Coach Fee Split: {data.settings.coachFeeSplitPercentage || 0}%
                </p>
                <Link href="/dashboard/owner/settings">
                  <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Edit Settings
                  </button>
                </Link>
              </>
            ) : (
              <p className="text-gray-600">No settings configured.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
