"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import DashboardHeader from "@/components/DashboardHeader";

export default function CoachPayments() {
  const { user, loading: userLoading } = useUser();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && user?.uid) {
      fetchPayments(user.uid);
    } else if (!user && !userLoading) {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [user, userLoading]);

  const fetchPayments = async (coachId) => {
    try {
      const response = await fetch("/api/coach/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      const data = await response.json();
      setPayments(data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading || userLoading)
    return (
      <div className="text-center p-6 text-gray-600">Loading payments...</div>
    );

  if (error)
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <DashboardHeader title="Payments" />

      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">
          Payment History
        </h2>
        {payments.length > 0 ? (
          <ul className="space-y-4">
            {payments.map((payment) => (
              <li key={payment._id} className="border-b pb-3">
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
          <p className="text-gray-600 text-center">No payments found yet.</p>
        )}
      </div>
    </div>
  );
}
