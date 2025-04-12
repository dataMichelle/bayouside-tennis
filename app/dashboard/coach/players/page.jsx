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
      if (response.ok) setPlayers(data.players);
      else throw new Error(data.error || "Failed to fetch players");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Players</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player._id} className="border">
                <td className="p-2">{player.name}</td>
                <td className="p-2">{player.email}</td>
                <td className="p-2">{player.phone}</td>
                <td className="p-2">{player.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
