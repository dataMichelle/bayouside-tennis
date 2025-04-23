"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function OwnerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/owner/payments");
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = await res.json();
        setPayments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatUSD = (amount) => `$${parseFloat(amount).toFixed(2)}`;

  if (loading)
    return <div className="p-6 text-gray-600">Loading payments...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <ProtectedRoute allowedRoles={["coach", "owner"]} redirectTo="/auth/login">
      <main className="p-6">
        <DashboardHeader title="Rental Payments" />

        {payments.length === 0 ? (
          <p className="text-gray-500">No payments found.</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="border p-3 text-left">Player</th>
                  <th className="border p-3 text-left">Total Paid</th>
                  <th className="border p-3 text-left">Coach Fee</th>
                  <th className="border p-3 text-left">Owner Share</th>
                  <th className="border p-3 text-left">Status</th>
                  <th className="border p-3 text-left">Booking</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{p.playerName || "Unknown"}</td>
                    <td className="p-3">{formatUSD(p.totalAmount)}</td>
                    <td className="p-3">{formatUSD(p.coachFee)}</td>
                    <td className="p-3">{formatUSD(p.ownerShare)}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3">{p.bookingTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
