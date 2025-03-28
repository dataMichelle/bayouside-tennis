"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Booking() {
  const { data: session } = useSession();
  const [selectedTime, setSelectedTime] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [coachAvailability, setCoachAvailability] = useState([]);
  const [selectedCoachTime, setSelectedCoachTime] = useState("");
  const [ballMachine, setBallMachine] = useState(false);

  // Fetch coaches on mount
  useEffect(() => {
    fetch("/api/coaches")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched coaches:", data);
        setCoaches(data);
      })
      .catch((error) => console.error("Error fetching coaches:", error));
  }, []);

  // Update available times when a coach is selected
  useEffect(() => {
    if (selectedCoach) {
      const coach = coaches.find((c) => c._id === selectedCoach);
      console.log("Selected coach:", coach);
      const availability =
        coach && coach.availability ? coach.availability : [];
      console.log("Coach availability:", availability);
      setCoachAvailability(availability);
      setSelectedCoachTime(""); // Reset coach time when coach changes
    } else {
      setCoachAvailability([]);
      setSelectedCoachTime("");
    }
  }, [selectedCoach, coaches]);

  const handleBooking = async () => {
    if (!session) {
      alert("Please sign in to book.");
      return;
    }
    if (!selectedTime && !selectedCoachTime) {
      alert("Please select a court time or coach availability.");
      return;
    }

    // Prioritize coach time if selected, otherwise use court time
    const startTime = selectedCoachTime
      ? new Date(
          `${new Date().toDateString()} ${selectedCoachTime.split("-")[0]}`
        )
      : new Date(selectedTime);
    const endTime = selectedCoachTime
      ? new Date(
          `${new Date().toDateString()} ${selectedCoachTime.split("-")[1]}`
        )
      : new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour default

    const booking = {
      userId: session.user.id,
      coachId: selectedCoach || null,
      startTime: startTime.toISOString(),
      duration: 1,
      ballMachine,
    };

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });

    if (response.ok) {
      alert("Court booked successfully!");
      setSelectedTime("");
      setSelectedCoach("");
      setSelectedCoachTime("");
      setBallMachine(false);
    } else {
      console.log("Booking failed:", await response.text());
    }
  };

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        Book a Tennis Court
      </h1>
      <div className="bg-white dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">
          Court Booking
        </h2>

        {/* Coach Dropdown */}
        <div className="mb-6">
          <label
            htmlFor="coach"
            className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-2"
          >
            Select a Coach (Optional)
          </label>
          <select
            id="coach"
            value={selectedCoach}
            onChange={(e) => {
              setSelectedCoach(e.target.value);
            }}
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">No Coach</option>
            {coaches.map((coach) => (
              <option key={coach._id} value={coach._id}>
                {coach.name} - {coach.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Coach Availability Dropdown */}
        {selectedCoach && (
          <div className="mb-6">
            <label
              htmlFor="coachTime"
              className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-2"
            >
              Select Coach Availability
            </label>
            <select
              id="coachTime"
              value={selectedCoachTime}
              onChange={(e) => setSelectedCoachTime(e.target.value)}
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a Time</option>
              {coachAvailability.map((slot, index) => {
                const start = slot.startTime || slot.from;
                const end = slot.endTime || slot.to;
                return (
                  <option key={index} value={`${start}-${end}`}>
                    {slot.day}: {start} - {end}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Court Time Picker */}
        <div className="mb-6">
          <label
            htmlFor="courtTime"
            className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-2"
          >
            Select Court Time Slot
          </label>
          <input
            type="datetime-local"
            id="courtTime"
            value={selectedTime}
            onChange={(e) => {
              setSelectedTime(e.target.value);
              // No reset of selectedCoach here
            }}
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Ball Machine Checkbox */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={ballMachine}
              onChange={(e) => setBallMachine(e.target.checked)}
              className="mr-2"
            />
            <span className="text-neutrals-700 dark:text-neutrals-300">
              Add Ball Machine Rental ($10/hr)
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleBooking}
          className="w-full px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
        >
          Confirm Booking
        </button>
      </div>
    </main>
  );
}
