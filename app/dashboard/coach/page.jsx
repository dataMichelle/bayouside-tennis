// app/dashboard/coach/page.jsx

"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function CoachDashboard() {
  const [coachName, setCoachName] = useState("");
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/coach/fee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId: user.uid }),
        });
        const data = await res.json();
        if (res.ok) {
          setCoachName(data.name);
          setFee(data.rate);
        } else {
          throw new Error(data.error || "Failed to fetch coach info");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="p-6">
      <DashboardHeader title={`Welcome, ${coachName || "Coach"}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-6">
        <Card
          title="My Schedule"
          description="View your upcoming sessions and court bookings."
          href="/dashboard/coach/schedule"
          color="blue"
        />

        <Card
          title="My Players"
          description="See your current students and their contact info."
          href="/dashboard/coach/players"
          color="green"
        />

        <Card
          title="Payments"
          description="Track earnings from coaching sessions."
          href="/dashboard/coach/payments"
          color="gray"
        />
      </div>

      <div className="mt-10 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500">
          Current Hourly Rate: <span className="font-semibold">${fee}/hr</span>
        </p>
      </div>
    </main>
  );
}

function Card({ title, description, href, color }) {
  const colorMap = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    gray: "bg-gray-700 hover:bg-gray-800",
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <Link
        href={href}
        className={`inline-block px-5 py-2 text-sm font-medium text-white rounded ${colorMap[color]}`}
      >
        Go to {title}
      </Link>
    </div>
  );
}
