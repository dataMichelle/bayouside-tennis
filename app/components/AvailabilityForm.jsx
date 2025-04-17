// components/AvailabilityForm.jsx

"use client";

import { useState } from "react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilityForm({ value = [], onChange }) {
  const [availability, setAvailability] = useState(value);

  const update = (newAvailability) => {
    setAvailability(newAvailability);
    onChange?.(newAvailability);
  };

  const handleAdd = () => {
    update([
      ...availability,
      { day: "Monday", startTime: "09:00", endTime: "10:00" },
    ]);
  };

  const handleRemove = (index) => {
    const newAvail = [...availability];
    newAvail.splice(index, 1);
    update(newAvail);
  };

  const handleChange = (index, field, val) => {
    const updated = [...availability];
    updated[index][field] = val;
    update(updated);
  };

  return (
    <div className="space-y-4">
      {availability.map((slot, index) => (
        <div key={index} className="flex items-center space-x-4">
          <select
            value={slot.day}
            onChange={(e) => handleChange(index, "day", e.target.value)}
            className="border rounded px-3 py-2"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => handleChange(index, "startTime", e.target.value)}
            className="border rounded px-3 py-2"
          />

          <span>-</span>

          <input
            type="time"
            value={slot.endTime}
            onChange={(e) => handleChange(index, "endTime", e.target.value)}
            className="border rounded px-3 py-2"
          />

          <button
            onClick={() => handleRemove(index)}
            className="text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Availability
      </button>
    </div>
  );
}
