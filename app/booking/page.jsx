"use client";

import { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const res = await fetch("/api/coach");
          if (!res.ok) throw new Error("Failed to fetch coaches");
          const data = await res.json();
          setCoaches(data);
        } catch (err) {
          setError(err.message);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleCoachSelect = (coach) => {
    setSelectedCoach(coach);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to book.</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Booking Page</h1>
      <p>Welcome, {user.email}</p>
      <button
        onClick={handleLogout}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
      <h2 className="text-2xl font-semibold mb-4">Select a Coach</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map((coach) => (
          <div
            key={coach._id}
            className={`p-4 border rounded cursor-pointer ${
              selectedCoach?._id === coach._id ? "bg-green-100" : "bg-white"
            }`}
            onClick={() => handleCoachSelect(coach)}
          >
            <h3 className="text-lg font-bold">{coach.name}</h3>
            <p>Specialty: {coach.specialty}</p>
            <p>Rate: {coach.rate ? `$${coach.rate}/hr` : "TBD"}</p>
          </div>
        ))}
      </div>
      {selectedCoach && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">
            Book with {selectedCoach.name}
          </h2>
          {/* Add booking form/logic here */}
          <p>Placeholder for booking form</p>
        </div>
      )}
    </div>
  );
}
