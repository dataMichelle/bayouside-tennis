"use client";
import { useState, useEffect } from "react";

export default function Booking() {
  const { data: session } = useSession();
  const [selectedTime, setSelectedTime] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [ballMachine, setBallMachine] = useState(false);

  // Fetch coaches on mount
  useEffect(() => {
    fetch("/api/coaches")
      .then((res) => res.json())
      .then((data) => setCoaches(data))
      .catch((error) => {});
  }, []);

  // Generate monthly calendar
  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get coach's available days
  const getAvailableDays = () => {
    if (!selectedCoach) return [];
    const coach = coaches.find((c) => c._id === selectedCoach);
    if (!coach || !coach.availability) return [];
    return coach.availability.map((slot) => slot.day);
  };

  // Generate hourly slots for a day
  const getHourlySlots = (day) => {
    if (!selectedCoach || !day) return [];
    const coach = coaches.find((c) => c._id === selectedCoach);
    const slot = coach?.availability.find((s) => s.day === day);
    if (!slot) return [];

    const startHour = parseInt((slot.startTime || slot.from).split(":")[0], 10);
    const endHour = parseInt((slot.endTime || slot.to).split(":")[0], 10);
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const start = `${hour.toString().padStart(2, "0")}:00`;
      const end = `${(hour + 1).toString().padStart(2, "0")}:00`;
      slots.push(`${start}-${end}`);
    }
    return slots;
  };

  const handleBooking = async () => {
    if (!session) {
      alert("Please sign in to book.");
      return;
    }
    if (!selectedTime && !selectedSlot) {
      alert("Please select a court time or coach slot.");
      return;
    }

    const startTime = selectedSlot
      ? new Date(`${selectedDay.toDateString()} ${selectedSlot.split("-")[0]}`)
      : new Date(selectedTime);
    const endTime = selectedSlot
      ? new Date(`${selectedDay.toDateString()} ${selectedSlot.split("-")[1]}`)
      : new Date(startTime.getTime() + 60 * 60 * 1000);

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
      setSelectedDay(null);
      setSelectedSlot("");
      setBallMachine(false);
    }
  };

  const calendarDays = getCalendarDays();
  const availableDays = getAvailableDays();
  const hourlySlots = getHourlySlots(
    selectedDay?.toLocaleString("en-US", { weekday: "long" })
  );

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        Book a Court
      </h1>
      <div className="bg-swamp-200  dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBooking();
          }}
        >
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
                setSelectedDay(null);
                setSelectedSlot("");
                setSelectedTime("");
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

          {/* Monthly Calendar */}
          {selectedCoach && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-2">
                Coach Availability Calendar
              </h3>
              <div className="grid grid-cols-7 gap-2 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="font-bold text-neutrals-700 dark:text-neutrals-300"
                    >
                      {day}
                    </div>
                  )
                )}
                {calendarDays.map((day, index) => {
                  const dayName = day
                    ? day.toLocaleString("en-US", { weekday: "long" })
                    : "";
                  const isAvailable = day && availableDays.includes(dayName);
                  const isSelected =
                    day &&
                    selectedDay &&
                    day.getTime() === selectedDay.getTime();
                  return (
                    <button
                      key={index}
                      onClick={() => day && isAvailable && setSelectedDay(day)}
                      className={`p-2 rounded-md ${
                        day
                          ? isAvailable
                            ? isSelected
                              ? "bg-green-400 text-black"
                              : "bg-green-200 hover:bg-green-300 text-black cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-transparent"
                      }`}
                      disabled={!day || !isAvailable}
                    >
                      {day ? day.getDate() : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Hourly Slots */}
          {selectedDay && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-2">
                Available Slots for {selectedDay.toLocaleDateString()}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {hourlySlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 rounded-md transition-colors ${
                      selectedSlot === slot
                        ? "bg-green-600 text-white"
                        : "bg-primary-100 hover:bg-primary-200 dark:bg-primary-700 dark:hover:bg-primary-600 text-primary-700 dark:text-primary-100"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Court Time Picker (No Coach) */}
          {!selectedCoach && (
            <div className="mb-6">
              <label
                htmlFor="courtTime"
                className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-2"
              >
                Select Court Time Slot (No Coach)
              </label>
              <input
                type="datetime-local"
                id="courtTime"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Ball Machine Checkbox */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={ballMachine}
                onChange={(e) => setBallMachine(e.target.checked)}
                className="mr-2"
              />
              <span>Add Ball Machine Rental ($10/hr)</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            Confirm Booking
          </button>
        </form>
      </div>
    </main>
  );
}
