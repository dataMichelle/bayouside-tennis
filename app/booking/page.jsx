"use client";

import { useState, useEffect } from "react";
import { auth } from "../lib/firebase"; // Client-side Firebase
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to book.</div>;

  return (
    <div>
      <h1>Booking Page</h1>
      <p>Welcome, {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
      {/* Add booking logic here */}
    </div>
  );
}
