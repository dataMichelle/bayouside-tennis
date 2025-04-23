"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import DashboardHeader from "@/components/DashboardHeader";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CoachPlayers() {
  const { userData, loading } = useUser();
  const [players, setPlayers] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && userData?.id) {
      fetchPlayers(userData.id);
    } else if (!userData && !loading) {
      setError("Not authenticated");
      setFetchLoading(false);
    }
  }, [userData, loading]);

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
      setFetchLoading(false);
    }
  };

  if (fetchLoading || loading)
    return (
      <div className="text-center py-6 text-gray-600">Loading players...</div>
    );

  if (error)
    return <div className="text-center py-6 text-red-600">Error: {error}</div>;

  return (
    <ProtectedRoute allowedRoles={["coach", "owner"]} redirectTo="/auth/login">
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <div
                key={player._id}
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
                  <strong>Status:</strong> {player.paymentStatus || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
