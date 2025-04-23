"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function OwnerPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/owner/players");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch players");
        }
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

  const formatUSD = (cents) => {
    if (cents === "") return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading)
    return <div className="p-6 text-gray-600">Loading players...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <ProtectedRoute allowedRoles={["coach", "owner"]} redirectTo="/auth/login">
      <main className="p-6">
        <DashboardHeader title="Registered Players" />

        {players.length === 0 ? (
          <p className="text-gray-500">No players found.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {players.map((player, index) => (
              <div
                key={player._id || index}
                className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {player.name || "N/A"}
                </h3>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {player.email || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {player.phone || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Bookings:</strong> {player.bookingCount || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total Paid:</strong> {formatUSD(player.totalPaid)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last Booking:</strong> {player.lastBooking || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
