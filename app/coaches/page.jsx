"use client";
import { useState, useEffect } from "react";

export default function Coaches() {
  const [coaches, setCoaches] = useState([]);

  // Fetch coaches on mount
  useEffect(() => {
    fetch("/api/coaches")
      .then((res) => res.json())
      .then((data) => setCoaches(data))
      .catch((error) => console.error("Error fetching coaches:", error));
  }, []);

  // Helper function to convert 24-hour time to 12-hour AM/PM
  const formatTimeTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const adjustedHour = hourNum % 12 || 12; // Converts 0 to 12 for midnight, 13 to 1, etc.
    return `${adjustedHour}:${minutes} ${period}`;
  };

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        Our Coaches
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {coaches.length > 0 ? (
          coaches.map((coach) => (
            <div
              key={coach._id}
              className="bg-swamp-200 dark:bg-neutrals-800 p-6 rounded-lg shadow-md"
            >
              <h2 className="text-lg font-semibold text-primary-600 mb-2">
                {coach.name}
              </h2>
              <p className="text-neutrals-600 dark:text-neutrals-300 mb-1">
                Specialty: {coach.specialty}
              </p>
              <p className="text-neutrals-600 dark:text-neutrals-300 mb-2">
                Rate: {coach.rate ? `$${coach.rate}/hr` : "TBD"}
              </p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-primary-500 mb-1">
                  Availability:
                </h3>
                <ul className="text-neutrals-600 dark:text-neutrals-300 text-sm">
                  {coach.availability && coach.availability.length > 0 ? (
                    coach.availability.map((slot, index) => (
                      <li key={index}>
                        {slot.day}:{" "}
                        {formatTimeTo12Hour(slot.startTime || slot.from)} -{" "}
                        {formatTimeTo12Hour(slot.endTime || slot.to)}
                      </li>
                    ))
                  ) : (
                    <li>No availability listed</li>
                  )}
                </ul>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-neutrals-600 dark:text-neutrals-300 col-span-full">
            Loading coaches...
          </p>
        )}
      </div>
    </main>
  );
}
