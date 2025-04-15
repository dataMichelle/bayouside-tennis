"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CoachPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("Fetching payments for coachId:", user.uid);
          const response = await fetch("/api/coach/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coachId: user.uid }),
          });
          if (!response.ok) {
            throw new Error("Failed to fetch payments");
          }
          const coachPayments = await response.json();
          console.log(
            "Payments received:",
            JSON.stringify(coachPayments, null, 2)
          );
          setPayments(coachPayments);
        } catch (err) {
          console.error("Error fetching payments:", err);
          setError(err.message);
        }
      } else {
        setError("Not authenticated");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatTimeTo12HourCDT = (time) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    });
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error)
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        Coach Payments
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">
          Payment History
        </h2>
        {payments.length > 0 ? (
          <ul className="space-y-4">
            {payments.map((payment) => (
              <li key={payment._id.toString()} className="border-b pb-2">
                <p>
                  <strong>Player:</strong> {payment.playerName}
                </p>
                <p>
                  <strong>Amount:</strong> ${payment.amount.toFixed(2)}
                </p>
                <p>
                  <strong>Status:</strong> {payment.status}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(payment.createdAt).toLocaleDateString("en-US", {
                    timeZone: "America/Chicago",
                  })}
                </p>
                <p>
                  <strong>Booking Time:</strong> {payment.bookingTime}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No payments found.</p>
        )}
      </div>
    </div>
  );
}
