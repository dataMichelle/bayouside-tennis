"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CoachPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const coachId = user.uid;
        console.log("CoachPlayers - Coach ID:", coachId);
        await fetchPlayers(coachId);
      } else {
        setError("Not authenticated");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPlayers = async (coachId) => {
    try {
      const response = await fetch("/api/coach/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Players fetched:", JSON.stringify(data.players, null, 2));
        setPlayers(data.players);
      } else {
        throw new Error(data.error || "Failed to fetch players");
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Players</h1>
      {players.length === 0 ? (
        <p className="text-gray-600 text-center">No players found.</p>
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
