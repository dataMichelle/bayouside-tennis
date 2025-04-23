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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {payments.map((p) => (
              <div
                key={p._id}
                className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {p.playerName || "Unknown"}
                </h3>
                <p className="text-sm text-gray-600">
                  <strong>Total Paid:</strong> {formatUSD(p.totalAmount)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Coach Fee:</strong> {formatUSD(p.coachFee)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Owner Share:</strong> {formatUSD(p.ownerShare)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {p.status}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Booking:</strong> {p.bookingTime}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
