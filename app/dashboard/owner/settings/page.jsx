"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";

export default function OwnerSettingsPage() {
  const [form, setForm] = useState({
    courtRentalCost: "",
    ballMachineCost: "",
    coachFeeSplitPercentage: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/owner/settings");
        const data = await res.json();
        setForm({
          courtRentalCost: data.courtRentalCost?.toString() || "",
          ballMachineCost: data.ballMachineCost?.toString() || "",
          coachFeeSplitPercentage:
            data.coachFeeSplitPercentage?.toString() || "",
        });
      } catch {
        setMessage("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = {
        courtRentalCost: parseInt(form.courtRentalCost),
        ballMachineCost: parseInt(form.ballMachineCost),
        coachFeeSplitPercentage: parseInt(form.coachFeeSplitPercentage),
      };

      const res = await fetch("/api/owner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      setMessage("✅ Settings updated successfully");
    } catch {
      setMessage("❌ Error updating settings");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <DashboardHeader title="Court Rental Settings" />
      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <Input
          label="Court Rental Cost ($/hr)"
          name="courtRentalCost"
          value={form.courtRentalCost}
          onChange={handleChange}
        />
        <Input
          label="Ball Machine Cost ($/hr)"
          name="ballMachineCost"
          value={form.ballMachineCost}
          onChange={handleChange}
        />
        <Input
          label="Coach Fee Split (%) — % paid to coach"
          name="coachFeeSplitPercentage"
          value={form.coachFeeSplitPercentage}
          onChange={handleChange}
        />

        {message && (
          <p className="text-center text-sm text-blue-600">{message}</p>
        )}

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block font-medium text-sm text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border px-4 py-2 rounded bg-white shadow-sm"
      />
    </div>
  );
}
