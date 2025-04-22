"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import DashboardHeader from "@/components/DashboardHeader";

export default function CoachPayments() {
  const { userData, loading: userLoading } = useUser();
  const [payments, setPayments] = useState([]);
  const [totalCoachPayments, setTotalCoachPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && userData?.id) {
      fetchPayments(userData.id);
    } else if (!userData && !userLoading) {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [userData, userLoading]);

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
      const { payments, totalCoachPayments } = await response.json();
      setPayments(payments || []);
      setTotalCoachPayments(totalCoachPayments || 0);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      timeZone: "America/Chicago",
    });
  };

  const formatUSD = (amount) => {
    if (!amount && amount !== 0) return "-";
    return `$${amount.toFixed(2)}`;
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

      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">
          Payment History
        </h2>
        <p className="text-lg mb-4">
          <strong>Total Payments to Date:</strong> $
          {totalCoachPayments.toFixed(2)}
        </p>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="border p-3 text-left">Player Name</th>
                  <th className="border p-3 text-left">Total Amount</th>
                  <th className="border p-3 text-left">Coach Fee</th>
                  <th className="border p-3 text-left">Status</th>
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Booking Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{payment.playerName || "Unknown"}</td>
                    <td className="p-3">{formatUSD(payment.amount)}</td>
                    <td className="p-3">{formatUSD(payment.coachFee)}</td>
                    <td className="p-3">{payment.status || "Unknown"}</td>
                    <td className="p-3">{formatDate(payment.createdAt)}</td>
                    <td className="p-3">{payment.bookingTime || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center">No payments found yet.</p>
        )}
      </div>
    </div>
  );
}
