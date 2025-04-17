"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import DashboardHeader from "@/components/DashboardHeader";

export default function CoachPlayers() {
  const { user, loading: userLoading } = useUser();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && user?.uid) {
      fetchPlayers(user.uid);
    } else if (!user && !userLoading) {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [user, userLoading]);

  const fetchPlayers = async (coachId) => {
    try {
      const response = await fetch("/api/coach/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch players");
      setPlayers(data.players || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || userLoading)
    return (
      <div className="text-center py-6 text-gray-600">Loading players...</div>
    );

  if (error)
    return <div className="text-center py-6 text-red-600">Error: {error}</div>;

  return (
    <div>
      <DashboardHeader title="My Students" />
      {players.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No players found yet.</p>
          <p className="text-sm mt-2">
            Players will appear here after your first booking.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Phone</th>
                <th className="border p-3 text-left">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{player.name || "N/A"}</td>
                  <td className="p-3">{player.email || "N/A"}</td>
                  <td className="p-3">{player.phone || "N/A"}</td>
                  <td className="p-3">{player.paymentStatus || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
