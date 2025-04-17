// app/dashboard/owner/page.jsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import DashboardHeader from "@/components/DashboardHeader";

export default function OwnerDashboard() {
  const { role, loading } = useUser();

  if (loading)
    return <div className="p-6 text-center">Loading dashboard...</div>;
  if (role !== "owner")
    return <div className="p-6 text-red-600">Unauthorized</div>;

  return (
    <main className="min-h-screen p-6 bg-gray-100">
      <DashboardHeader title="Owner Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Coaches Management */}
        <DashboardCard
          title="Manage Coaches"
          description="Edit coach bios, rates, and availability."
          href="/dashboard/owner/coaches"
          buttonLabel="Manage Coaches"
          color="green"
        />

        {/* Rental Earnings */}
        <DashboardCard
          title="Rental Payments"
          description="View revenue from court and ball machine rentals."
          href="/dashboard/owner/payments"
          buttonLabel="View Payments"
          color="blue"
        />

        {/* Players */}
        <DashboardCard
          title="Player Directory"
          description="View a list of all registered players."
          href="/dashboard/owner/players"
          buttonLabel="View Players"
          color="gray"
        />

        {/* Settings */}
        <DashboardCard
          title="Update Rental Settings"
          description="Change prices for court and ball machine rentals."
          href="/dashboard/owner/settings"
          buttonLabel="Update Settings"
          color="orange"
        />
      </div>
    </main>
  );
}

function DashboardCard({ title, description, href, buttonLabel, color }) {
  const colorMap = {
    green: "bg-green-600 hover:bg-green-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    gray: "bg-gray-700 hover:bg-gray-800",
    orange: "bg-orange-500 hover:bg-orange-600",
  };

  return (
    <section className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">{title}</h2>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link
        href={href}
        className={`inline-block px-5 py-2 text-sm font-medium text-white rounded ${colorMap[color]}`}
      >
        {buttonLabel}
      </Link>
    </section>
  );
}
