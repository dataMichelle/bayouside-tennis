"use client";

import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { usePayment, PaymentProvider } from "../../context/PaymentContext";

function BookingContent() {
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [pendingBookingIds, setPendingBookingIds] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);
  const [currentDay, setCurrentDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    initiatePayment,
    confirmBookings,
    error: paymentError,
    isProcessing,
  } = usePayment();

  useEffect(() => {
    console.log("BookingPage useEffect started");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      console.log(
        "Auth state changed, user:",
        currentUser ? currentUser.uid : "none"
      );
      if (currentUser) {
        try {
          const [coachRes, bookingsRes, settingsRes] = await Promise.all([
            fetch("/api/coach"),
            fetch("/api/bookings"),
            fetch("/api/settings"),
          ]);
          console.log("API responses received:", {
            coach: coachRes.ok,
            bookings: bookingsRes.ok,
            settings: settingsRes.ok,
          });
          if (!coachRes.ok)
            throw new Error(
              `Failed to fetch coaches: ${
                coachRes.status
              } ${await coachRes.text()}`
            );
          if (!bookingsRes.ok)
            throw new Error(
              `Failed to fetch bookings: ${
                bookingsRes.status
              } ${await bookingsRes.text()}`
            );
          if (!settingsRes.ok)
            throw new Error(
              `Failed to fetch settings: ${
                coachRes.status
              } ${await coachRes.text()}`
            );
          const coachData = await coachRes.json();
          const bookingsData = await bookingsRes.json();
          const settingsData = await settingsRes.json();
          console.log("Data fetched:", {
            coaches: coachData.map(c => ({ id: c._id, name: c.name })),
            bookings: bookingsData.length,
            settings: settingsData,
          });
          setCoaches(coachData);
          setBookings(bookingsData);
          setSettings(settingsData);

          const success = searchParams.get("success");
          const bookingIds = searchParams.get("bookingIds");
          if (success === "true" && bookingIds) {
            try {
              const ids = JSON.parse(decodeURIComponent(bookingIds));
              console.log("Confirming bookings on redirect:", ids);
              await confirmBookings(ids);
              console.log("Bookings confirmed:", ids);
            } catch (err) {
              console.error("Error confirming bookings on redirect:", err);
              setError("Failed to confirm bookings: " + err.message);
            }
            router.replace("/booking");
          }
        } catch (err) {
          console.error("BookingPage fetch error:", err.message);
          setError(err.message);
        }
      }
      setLoading(false);
      console.log("BookingPage useEffect completed, loading set to false");
    });
    return () => {
      console.log("Cleaning up BookingPage useEffect");
      unsubscribe();
    };
  }, [searchParams, router, confirmBookings]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const formatTimeTo12HourCDT = (time) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    });
  };

  const generateHourlySlots = (startTime, endTime, day, date) => {
    console.log(`Generating slots for ${day}: ${startTime} - ${endTime}`);
    if (!startTime || !endTime) {
      console.log("Invalid time format, returning empty slots");
      return [];
    }
    const start = parseInt(startTime.split(":")[0], 10);
    const end = parseInt(endTime.split(":")[0], 10);
    if (isNaN(start) || isNaN(end) || start >= end) {
      console.log("Invalid start/end hours:", { start, end });
      return [];
    }
    const slots = [];
    for (let hour = start; hour < end; hour++) {
      const slotStart = `${hour.toString().padStart(2, "0")}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, "0")}:00`;
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      slots.push({
        day,
        startTime: slotStart,
        endTime: slotEnd,
        date: slotDate,
      });
    }
    console.log(`Generated ${slots.length} slots:`, slots);
    return slots;
  };

  const getAvailableSlotsForDay = (date) => {
    console.log(`Getting slots for date: ${date.toISOString()}`);
    if (!selectedCoach) {
      console.log("No coach selected");
      return [];
    }
    const coach = coaches.find((c) => c._id === selectedCoach) || {
      availability: [],
      name: "Unknown",
    };
    const availability = Array.isArray(coach.availability)
      ? coach.availability
      : [];
    console.log(`Coach ${coach.name} availability:`, availability);
    const dayName = date.toLocaleString("en-US", { weekday: "long" });
    const dayAvailability = availability.find(
      (avail) => avail.day?.toLowerCase() === dayName.toLowerCase()
    );
    console.log(`Day ${dayName} availability:`, dayAvailability);
    if (!dayAvailability) {
      console.log(`No availability for ${dayName}`);
      return [];
    }

    const allSlots = generateHourlySlots(
      dayAvailability.startTime,
      dayAvailability.endTime,
      dayName,
      date
    );
    const availableSlots = allSlots.filter((slot) => {
      return !bookings.some((booking) => {
        const sameCoach =
          booking.coachId === selectedCoach ||
          (!booking.coachId && selectedCoach === "no-coach");
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const slotStart = new Date(slot.date);
        slotStart.setHours(parseInt(slot.startTime.split(":")[0]), 0, 0, 0);
        const slotEnd = new Date(slot.date);
        slotEnd.setHours(parseInt(slot.endTime.split(":")[0]), 0, 0, 0);
        const timeOverlap =
          (bookingStart <= slotStart && slotStart < bookingEnd) ||
          (bookingStart < slotEnd && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && bookingEnd <= slotEnd);
        const isPendingOrConfirmed = ["pending", "confirmed"].includes(
          booking.status
        );
        return sameCoach && timeOverlap && isPendingOrConfirmed;
      });
    });
    console.log(`Available slots for ${dayName}:`, availableSlots);
    return availableSlots;
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const availableSlots = getAvailableSlotsForDay(date);
    return availableSlots.length > 0 ? (
      <div className="text-xs text-green-600">
        {availableSlots.length} slots
      </div>
    ) : null;
  };

  const handleDateClick = (date) => {
    console.log(`Date clicked: ${date.toISOString()}`);
    const availableSlots = getAvailableSlotsForDay(date);
    if (availableSlots.length > 0) {
      setCurrentDay(date);
      setSelectedDaySlots(
        availableSlots.map((slot) => ({
          ...slot,
          isSelected: selectedSlots.some(
            (s) =>
              s.date.toISOString() === slot.date.toISOString() &&
              s.startTime === slot.startTime
          ),
        }))
      );
      setSlotModalOpen(true);
    } else {
      console.log("No slots available for selected date");
      setError("No available slots for this date");
    }
  };

  const handleSlotToggle = (slot) => {
    console.log(`Toggling slot: ${slot.startTime}`);
    setSelectedDaySlots((prev) =>
      prev.map((s) =>
        s.startTime === slot.startTime &&
        s.date.toISOString() === slot.date.toISOString()
          ? { ...s, isSelected: !s.isSelected }
          : s
      )
    );
  };

  const confirmSlotSelection = () => {
    console.log("Confirming slot selection");
    const newSelectedSlots = selectedDaySlots
      .filter((s) => s.isSelected)
      .map((slot) => ({
        ...slot,
        date: new Date(slot.date),
      }));
    setSelectedSlots((prev) => [
      ...prev.filter(
        (s) => s.date.toDateString() !== currentDay.toDateString()
      ),
      ...newSelectedSlots,
    ]);
    setSlotModalOpen(false);
    console.log("Updated selected slots:", newSelectedSlots);
  };

  const calculateCostBreakdown = () => {
    const hours = selectedSlots.length;
    const coach =
      selectedCoach === "no-coach"
        ? null
        : coaches.find((c) => c._id === selectedCoach);
    const coachRate = coach && coach.rate ? parseFloat(coach.rate) : 0;
    const courtCost = settings.courtRentalCost || 20;
    const ballMachineCost = ballMachine ? settings.ballMachineCost || 40 : 0;
    const total = (coachRate + courtCost + ballMachineCost) * hours;
    return {
      coachFee: coachRate * hours,
      courtRental: courtCost * hours,
      ballMachine: ballMachineCost * hours,
      total,
    };
  };

  const calculateTotalCost = () => {
    const { total } = calculateCostBreakdown();
    return total;
  };

  const handleBookingConfirm = async () => {
    if (!user || selectedSlots.length === 0) {
      setError("Please select slots");
      return;
    }
    try {
      const sortedSlots = [...selectedSlots].sort((a, b) => a.date - b.date);
      const mergedBookings = [];
      let currentBooking = {
        ...sortedSlots[0],
        endTime: sortedSlots[0].endTime,
      };

      for (let i = 1; i < sortedSlots.length; i++) {
        const prevEnd = new Date(currentBooking.date);
        prevEnd.setHours(
          parseInt(currentBooking.endTime.split(":")[0]),
          0,
          0,
          0
        );
        const nextStart = new Date(sortedSlots[i].date);
        nextStart.setHours(
          parseInt(sortedSlots[i].startTime.split(":")[0]),
          0,
          0,
          0
        );

        if (
          prevEnd.getTime() === nextStart.getTime() &&
          currentBooking.day === sortedSlots[i].day
        ) {
          currentBooking.endTime = sortedSlots[i].endTime;
        } else {
          mergedBookings.push({ ...currentBooking });
          currentBooking = {
            ...sortedSlots[i],
            endTime: sortedSlots[i].endTime,
          };
        }
      }
      mergedBookings.push({ ...currentBooking });

      const bookingPromises = mergedBookings.map((slot) => {
        const slotStart = new Date(slot.date);
        slotStart.setHours(parseInt(slot.startTime.split(":")[0]), 0, 0, 0);
        const slotEnd = new Date(slot.date);
        slotEnd.setHours(parseInt(slot.endTime.split(":")[0]), 0, 0, 0);
        const bookingData = {
          playerId: user.uid,
          coachId: selectedCoach === "no-coach" ? null : selectedCoach,
          day: slot.day,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          ballMachine,
          status: "pending",
          totalCost: calculateTotalCost() / mergedBookings.length,
          createdAt: new Date().toISOString(),
        };
        console.log("Submitting booking:", bookingData);
        return fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });
      });

      const responses = await Promise.all(bookingPromises);
      const bookingIds = [];
      for (const res of responses) {
        if (!res.ok) {
          console.error("Booking response error:", await res.text());
          throw new Error("Failed to save booking");
        }
        const data = await res.json();
        bookingIds.push(data.id);
      }
      setModalOpen(false);
      setPendingBookingIds(bookingIds);
      setPaymentModalOpen(true);
    } catch (err) {
      console.error("Booking confirm error:", err.message);
      setError(err.message);
    }
  };

  const handlePaymentConfirm = async () => {
    try {
      console.log("Initiating payment for booking IDs:", pendingBookingIds);
      const paymentIntent = await initiatePayment(
        pendingBookingIds,
        calculateTotalCost(),
        `Booking for ${selectedSlots.length} slot(s)`,
        user.uid
      );
      console.log("Payment initiated:", paymentIntent);

      // Fallback: Save payments
      const paymentPromises = pendingBookingIds.map((bookingId) => {
        const paymentData = {
          bookingId,
          userId: user.uid,
          amount: Math.round(calculateTotalCost() * 100 / pendingBookingIds.length),
          currency: "USD",
          stripePaymentId: paymentIntent?.id || "fallback_" + Date.now(),
        };
        console.log("Saving fallback payment for bookingId:", bookingId, paymentData);
        return fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        });
      });

      const paymentResponses = await Promise.all(paymentPromises);
      for (const res of paymentResponses) {
        if (!res.ok) {
          console.error("Fallback payment error:", await res.text());
        } else {
          console.log("Fallback payment saved:", await res.json());
        }
      }

      // Fallback: Confirm bookings
      console.log("Confirming bookings:", pendingBookingIds);
      await confirmBookings(pendingBookingIds);

      // Refresh bookings
      const bookingsResponse = await fetch("/api/bookings");
      if (!bookingsResponse.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const updatedBookings = await bookingsResponse.json();
      console.log("Updated bookings:", JSON.stringify(updatedBookings, null, 2));
      setBookings(
        updatedBookings.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        )
      );
      setPaymentModalOpen(false);
    } catch (err) {
      console.error("Payment confirm error:", err.message);
      setError("Payment failed: " + err.message);
      setPaymentModalOpen(false);
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
                console.log("Selected coach ID:", e.target.value);
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
                Select Dates (Central Time)
              </h2>
              <Calendar
                onChange={setCalendarDate}
                value={calendarDate}
                tileContent={tileContent}
                onClickDay={handleDateClick}
                className="mx-auto"
              />
              <div className="mt-4">
                <h3 className="text-md font-medium text-neutrals-700 dark:text-neutrals-300">
                  Selected Slots:
                </h3>
                {selectedSlots.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedSlots.map((slot, index) => (
                      <li key={index}>
                        {slot.day} {slot.date.toLocaleDateString()}{" "}
                        {formatTimeTo12HourCDT(slot.date)} -{" "}
                        {formatTimeTo12HourCDT(
                          new Date(slot.date).setHours(slot.date.getHours() + 1)
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutrals-600 dark:text-neutrals-300">
                    No slots selected.
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
                    coaches.find((c) => c._id === selectedCoach)?.name || "Unknown"
                  }`}
            </p>
            <ul className="mb-4">
              {selectedSlots.map((slot, index) => (
                <li key={index}>
                  {slot.day} {slot.date.toLocaleDateString()}:{" "}
                  {formatTimeTo12HourCDT(slot.date)} -{" "}
                  {formatTimeTo12HourCDT(
                    new Date(slot.date).setHours(slot.date.getHours() + 1)
                  )}
                </li>
              ))}
            </ul>
            <p>Ball Machine: {ballMachine ? "Yes" : "No"}</p>
            <div className="mt-2">
              <h3 className="font-semibold">Cost Breakdown</h3>
              <ul className="list-none">
                <li>
                  Coach Fee: ${calculateCostBreakdown().coachFee.toFixed(2)}
                </li>
                <li>
                  Court Rental: ${calculateCostBreakdown().courtRental.toFixed(2)}
                </li>
                <li>
                  Ball Machine: ${calculateCostBreakdown().ballMachine.toFixed(2)}
                </li>
                <li className="font-semibold mt-2">
                  Total: ${calculateCostBreakdown().total.toFixed(2)}
                </li>
              </ul>
            </div>
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

      {slotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setSlotModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              Select Slots for {currentDay?.toLocaleDateString() || "Unknown"} (CDT)
            </h2>
            {selectedDaySlots.length > 0 ? (
              <div className="space-y-2">
                {selectedDaySlots.map((slot, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`day-slot-${index}`}
                      checked={slot.isSelected}
                      onChange={() => handleSlotToggle(slot)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`day-slot-${index}`}
                      className="text-neutrals-700 dark:text-neutrals-300"
                    >
                      {slot.startTime} - {slot.endTime}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No slots available for this day.</p>
            )}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setSlotModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSlotSelection}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={selectedDaySlots.every((slot) => !slot.isSelected)}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Payment Required</h2>
            <p>Booking saved as pending. Complete payment to confirm.</p>
            <div className="mt-2">
              <h3 className="font-semibold">Cost Breakdown</h3>
              <ul className="list-none">
                <li>
                  Coach Fee: ${calculateCostBreakdown().coachFee.toFixed(2)}
                </li>
                <li>
                  Court Rental: ${calculateCostBreakdown().courtRental.toFixed(2)}
                </li>
                <li>
                  Ball Machine: ${calculateCostBreakdown().ballMachine.toFixed(2)}
                </li>
                <li className="font-semibold mt-2">
                  Total: ${calculateCostBreakdown().total.toFixed(2)}
                </li>
              </ul>
            </div>
            {paymentError && (
              <p className="text-red-500 mt-2">{paymentError}</p>
            )}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pay with Stripe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BookingPage() {
  return (
    <PaymentProvider>
      <BookingContent />
    </PaymentProvider>
  );
}