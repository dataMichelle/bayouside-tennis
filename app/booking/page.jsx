"use client";

import { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState({
    courtRentalCost: 0,
    ballMachineCost: 0,
  });
  const [selectedCoach, setSelectedCoach] = useState("");
  const [ballMachine, setBallMachine] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const [coachRes, bookingsRes, settingsRes] = await Promise.all([
            fetch("/api/coach"),
            fetch("/api/bookings"),
            fetch("/api/settings"),
          ]);
          if (!coachRes.ok)
            throw new Error(`Failed to fetch coaches: ${coachRes.status}`);
          if (!bookingsRes.ok)
            throw new Error(`Failed to fetch bookings: ${bookingsRes.status}`);
          if (!settingsRes.ok)
            throw new Error(`Failed to fetch settings: ${settingsRes.status}`);
          const coachData = await coachRes.json();
          const bookingsData = await bookingsRes.json();
          const settingsData = await settingsRes.json();
          console.log("Coaches:", JSON.stringify(coachData, null, 2));
          console.log("Bookings:", JSON.stringify(bookingsData, null, 2));
          setCoaches(coachData);
          setBookings(bookingsData);
          setSettings(settingsData);
        } catch (err) {
          setError(err.message);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const formatTimeTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const adjustedHour = hourNum % 12 || 12;
    return `${adjustedHour}:${minutes} ${period}`;
  };

  const parseTimeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const normalizeTime = (time) => {
    if (!time) return "00:00";
    if (time.includes("T")) {
      return time.split("T")[1].substring(0, 5); // "HH:MM" from ISO
    }
    return time.padStart(5, "0"); // Ensure "HH:MM"
  };

  const generateHourlySlots = (startTime, endTime, day) => {
    const start = parseInt(startTime.split(":")[0], 10);
    const end = parseInt(endTime.split(":")[0], 10);
    const slots = [];
    for (let hour = start; hour < end; hour++) {
      const slotStart = `${hour.toString().padStart(2, "0")}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, "0")}:00`;
      slots.push({ day, startTime: slotStart, endTime: slotEnd });
    }
    return slots;
  };

  const getAvailabilityCheckboxes = () => {
    const isBooked = (slot, coachId) => {
      return bookings.some((booking) => {
        const sameCoach =
          booking.coachId === coachId ||
          (!booking.coachId && coachId === "no-coach");
        // Use slot.day as the definitive day; only enforce booking.day if present
        const sameDay = booking.day ? slot.day === booking.day : true;
        const slotStart = parseTimeToMinutes(slot.startTime);
        const slotEnd = parseTimeToMinutes(slot.endTime);
        const bookingStart = parseTimeToMinutes(
          normalizeTime(booking.startTime)
        );
        const bookingEnd = parseTimeToMinutes(normalizeTime(booking.endTime));
        const timeOverlap =
          (bookingStart <= slotStart && slotStart < bookingEnd) ||
          (bookingStart < slotEnd && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && bookingEnd <= slotEnd);
        const isPendingOrConfirmed = ["pending", "confirmed"].includes(
          booking.status
        );
        const result =
          sameCoach && sameDay && timeOverlap && isPendingOrConfirmed;
        console.log(
          `Checking slot ${slot.day} ${slot.startTime}-${slot.endTime} for coach ${coachId}:`,
          {
            sameCoach,
            sameDay,
            bookingDay: booking.day || "N/A",
            slotDay: slot.day,
            slotStart,
            slotEnd,
            bookingStart,
            bookingEnd,
            timeOverlap,
            isPendingOrConfirmed,
            result,
            bookingId: booking._id,
          }
        );
        return result;
      });
    };

    if (selectedCoach === "no-coach") {
      const availableSlots = [
        { day: "Monday", startTime: "10:00", endTime: "11:00" },
        { day: "Tuesday", startTime: "14:00", endTime: "15:00" },
      ];
      return availableSlots
        .filter((slot) => !isBooked(slot, "no-coach"))
        .map((slot, index) => (
          <div key={index} className="flex items-center m-2">
            <input
              type="checkbox"
              id={`slot-${index}`}
              checked={selectedSlots.some(
                (s) => s.day === slot.day && s.startTime === slot.startTime
              )}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSlots((prev) => [...prev, slot]);
                } else {
                  setSelectedSlots((prev) =>
                    prev.filter(
                      (s) =>
                        s.day !== slot.day || s.startTime !== slot.startTime
                    )
                  );
                }
              }}
              className="mr-2"
            />
            <label
              htmlFor={`slot-${index}`}
              className="text-neutrals-700 dark:text-neutrals-300"
            >
              {slot.day}: {formatTimeTo12Hour(slot.startTime)} -{" "}
              {formatTimeTo12Hour(slot.endTime)}
            </label>
          </div>
        ));
    }
    if (!selectedCoach) return [];
    const coach = coaches.find((c) => c._id === selectedCoach);
    if (!coach || !coach.availability) return [];
    const allSlots = coach.availability.flatMap((slot) =>
      generateHourlySlots(slot.startTime, slot.endTime, slot.day)
    );
    console.log(`All slots for ${coach.name}:`, allSlots);
    const filteredSlots = allSlots.filter(
      (slot) => !isBooked(slot, selectedCoach)
    );
    console.log(`Filtered slots for ${coach.name}:`, filteredSlots);
    return filteredSlots.map((slot, index) => (
      <div key={index} className="flex items-center m-2">
        <input
          type="checkbox"
          id={`slot-${index}`}
          checked={selectedSlots.some(
            (s) => s.day === slot.day && s.startTime === slot.startTime
          )}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedSlots((prev) => [...prev, slot]);
            } else {
              setSelectedSlots((prev) =>
                prev.filter(
                  (s) => s.day !== slot.day || s.startTime !== slot.startTime
                )
              );
            }
          }}
          className="mr-2"
        />
        <label
          htmlFor={`slot-${index}`}
          className="text-neutrals-700 dark:text-neutrals-300"
        >
          {slot.day}: {formatTimeTo12Hour(slot.startTime)} -{" "}
          {formatTimeTo12Hour(slot.endTime)}
        </label>
      </div>
    ));
  };

  const calculateTotalCost = () => {
    const hours = selectedSlots.length;
    const coach =
      selectedCoach === "no-coach"
        ? null
        : coaches.find((c) => c._id === selectedCoach);
    const coachRate = coach && coach.rate ? parseFloat(coach.rate) : 0;
    const courtCost = settings.courtRentalCost || 20;
    const ballMachineCost = ballMachine ? settings.ballMachineCost || 10 : 0;
    return (coachRate + courtCost + ballMachineCost) * hours;
  };

  const handleBookingConfirm = async () => {
    if (!user || selectedSlots.length === 0) return;
    try {
      const bookingPromises = selectedSlots.map((slot) => {
        const bookingData = {
          userId: user.uid,
          coachId: selectedCoach === "no-coach" ? null : selectedCoach,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          ballMachine,
          status: "pending",
          totalCost: calculateTotalCost(),
          createdAt: new Date().toISOString(),
        };
        return fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });
      });
      const responses = await Promise.all(bookingPromises);
      responses.forEach((res) => {
        if (!res.ok) throw new Error("Failed to save booking");
      });
      setModalOpen(false);
      setSelectedSlots([]);
      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (!user)
    return <div className="text-center p-6">Please log in to book.</div>;
  if (error)
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        Booking Page
      </h1>
      <div className="bg-swamp-200 dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label
              htmlFor="coach"
              className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
            >
              Select Coach
            </label>
            <select
              id="coach"
              value={selectedCoach}
              onChange={(e) => {
                setSelectedCoach(e.target.value);
                setSelectedSlots([]);
              }}
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a coach</option>
              <option value="no-coach">No Coach</option>
              {coaches.map((coach) => (
                <option key={coach._id} value={coach._id}>
                  {coach.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCoach && (
            <div>
              <h2 className="text-lg font-semibold text-primary-600 mb-2">
                Availability
              </h2>
              <div className="flex flex-wrap justify-center">
                {getAvailabilityCheckboxes().length > 0 ? (
                  getAvailabilityCheckboxes()
                ) : (
                  <p className="text-neutrals-600 dark:text-neutrals-300">
                    No availability listed.
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ballMachine"
              checked={ballMachine}
              onChange={(e) => setBallMachine(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="ballMachine"
              className="text-sm font-medium text-neutrals-700 dark:text-neutrals-300"
            >
              Rent Ball Machine
            </label>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={selectedSlots.length === 0}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-400"
          >
            Book Selected Slots
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors shadow-md"
          >
            Logout
          </button>
        </form>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
            <p>
              {selectedCoach === "no-coach"
                ? "No Coach"
                : `Coach: ${
                    coaches.find((c) => c._id === selectedCoach)?.name
                  }`}
            </p>
            <ul className="mb-4">
              {selectedSlots.map((slot, index) => (
                <li key={index}>
                  {slot.day}: {formatTimeTo12Hour(slot.startTime)} -{" "}
                  {formatTimeTo12Hour(slot.endTime)}
                </li>
              ))}
            </ul>
            <p>Ball Machine: {ballMachine ? "Yes" : "No"}</p>
            <p className="mt-2 font-semibold">
              Total Cost: ${calculateTotalCost().toFixed(2)}
            </p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
