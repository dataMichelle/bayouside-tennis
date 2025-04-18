// app/dashboard/owner/players/page.jsx

"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";

export default function OwnerPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/owner/players");
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const formatUSD = (cents) => `$${(cents / 100).toFixed(2)}`;

  if (loading)
    return <div className="p-6 text-gray-600">Loading players...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="p-6">
      <DashboardHeader title="Registered Players" />

      {players.length === 0 ? (
        <p className="text-gray-500">No players found.</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Phone</th>
                <th className="border p-3 text-left">Bookings</th>
                <th className="border p-3 text-left">Total Paid</th>
                <th className="border p-3 text-left">Last Booking</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">{player.name || "N/A"}</td>
                  <td className="p-3">{player.email || "N/A"}</td>
                  <td className="p-3">{player.phone || "N/A"}</td>
                  <td className="p-3">{player.bookingCount}</td>
                  <td className="p-3">{formatUSD(player.totalPaid)}</td>
                  <td className="p-3">
                    {player.lastBooking
                      ? new Date(player.lastBooking).toLocaleDateString("en-US")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
