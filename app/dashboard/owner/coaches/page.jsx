// app/dashboard/owner/coaches/page.jsx

"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";

export default function OwnerCoachesPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const res = await fetch("/api/owner/coaches");
        if (!res.ok) throw new Error("Failed to fetch coaches");
        const data = await res.json();
        setCoaches(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  if (loading)
    return <div className="p-6 text-gray-600">Loading coaches...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="p-6">
      <DashboardHeader title="Coaches" />

      {coaches.length === 0 ? (
        <p className="text-gray-500">No coaches found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {coaches.map((coach) => (
            <div
              key={coach._id}
              className="relative bg-white shadow-md rounded-lg p-6 border border-gray-200"
            >
              <div className="absolute top-2 right-3 text-sm text-gray-500">
                {coach.phone || "No phone"}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {coach.name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Rate: ${coach.rate}/hr
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Specialty: {coach.specialty?.join(", ")}
              </p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {coach.bio}
              </p>
              <Link
                href={`/dashboard/owner/coaches/${coach._id}`}
                className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                Edit Coach
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
