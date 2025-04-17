// app/dashboard/owner/coaches/[id]/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import AvailabilityForm from "@/components/AvailabilityForm";

export default function EditCoachPage() {
  const { id } = useParams();
  const router = useRouter();
  const [coach, setCoach] = useState(null);
  const [form, setForm] = useState({
    name: "",
    rate: "",
    bio: "",
    specialty: "",
  });
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchCoach = async () => {
      try {
        const res = await fetch(`/api/owner/coaches`);
        const data = await res.json();
        const coachData = data.find((c) => c._id === id);
        setCoach(coachData);
        setForm({
          name: coachData.name || "",
          rate: coachData.rate || "",
          bio: coachData.bio || "",
          specialty: coachData.specialty?.join(", ") || "",
        });
        setAvailability(coachData.availability || []);
      } catch (err) {
        setMessage("Failed to load coach");
      } finally {
        setLoading(false);
      }
    };
    fetchCoach();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch(`/api/owner/coaches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          rate: form.rate,
          bio: form.bio,
          specialty: form.specialty.split(",").map((s) => s.trim()),
          availability,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      setMessage("✅ Coach updated successfully");
      setTimeout(() => router.push("/dashboard/owner/coaches"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error updating coach");
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (!coach) return <div className="p-6 text-red-600">Coach not found</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <DashboardHeader title={`Edit ${coach.name}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
        <Input
          label="Hourly Rate ($)"
          name="rate"
          value={form.rate}
          onChange={handleChange}
        />
        <Textarea
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
        />
        <Input
          label="Specialty (comma-separated)"
          name="specialty"
          value={form.specialty}
          onChange={handleChange}
        />

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Availability
          </label>
          <AvailabilityForm value={availability} onChange={setAvailability} />
        </div>

        {message && (
          <p className="text-center text-sm text-blue-600">{message}</p>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
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
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border px-4 py-2 rounded bg-white shadow-sm"
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block font-medium text-sm text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full border px-4 py-2 rounded bg-white shadow-sm font-mono text-sm"
      ></textarea>
    </div>
  );
}
