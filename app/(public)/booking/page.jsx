"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { usePayment } from "@/context/PaymentContext";
import BookingModals from "@/components/BookingModals";
import { calculateCostBreakdown } from "@/utils/cost";
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [mongoUserId, setMongoUserId] = useState(null);
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);
  const [currentDay, setCurrentDay] = useState(null);
  const [pendingBookingIds, setPendingBookingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    initiatePayment,
    verifyPayments,
    error: paymentError,
    isProcessing,
  } = usePayment();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const userRes = await fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!userRes.ok) throw new Error("Failed to fetch user data");
          const userData = await userRes.json();
          setMongoUserId(userData._id);

          const [coachRes, bookingsRes, settingsRes] = await Promise.all([
            fetch("/api/coach"),
            fetch(`/api/player/reservations?playerId=${userData._id}`),
            fetch("/api/settings"),
          ]);

          if (!coachRes.ok) {
            const errorData = await coachRes.json();
            throw new Error(`Failed to fetch coaches: ${errorData.error}`);
          }
          if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");
          if (!settingsRes.ok) throw new Error("Failed to fetch settings");

          const coachData = await coachRes.json();
          const bookingsData = await bookingsRes.json();
          const settingsData = await settingsRes.json();

          setCoaches(Array.isArray(coachData) ? coachData : []);
          setBookings(bookingsData.bookings || []);
          setSettings(settingsData);

          const success = searchParams.get("success");
          const bookingIds = searchParams.get("bookingIds");
          if (success === "true" && bookingIds) {
            const ids = JSON.parse(decodeURIComponent(bookingIds));
            await verifyPayments(ids);
            router.replace("/players/booking");
          }
        } catch (err) {
          console.error("BookingPage fetch error:", err.message);
          setError(err.message);
        }
      } else {
        // Show toast and redirect to login
        toast.error("Please log in to access the booking page.", {
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500); //
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [searchParams, router, verifyPayments]);

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

  const generateHourlySlots = useCallback((startTime, endTime, day, date) => {
    const start = parseInt(startTime.split(":")[0], 10);
    const end = parseInt(endTime.split(":")[0], 10);
    if (isNaN(start) || isNaN(end)) {
      console.error("Invalid time format:", { startTime, endTime });
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
    return slots;
  }, []);

  const getAvailableSlotsForDay = useCallback(
    (date) => {
      if (!selectedCoach) return [];
      const coach = coaches.find((c) => c._id === selectedCoach) || {
        availability: [],
        userId: null,
      };
      const availability = Array.isArray(coach.availability)
        ? coach.availability
        : [];
      const dayName = date.toLocaleString("en-US", { weekday: "long" });
      const dayAvailability = availability.find(
        (avail) => avail.day === dayName
      );
      if (!dayAvailability) return [];

      const allSlots = generateHourlySlots(
        dayAvailability.startTime,
        dayAvailability.endTime,
        dayName,
        date
      );

      return allSlots.filter((slot) => {
        return !bookings.some((booking) => {
          const sameCoach =
            booking.coachId === coach.userId ||
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
    },
    [coaches, selectedCoach, bookings, generateHourlySlots]
  );

  const tileContent = useCallback(
    ({ date, view }) => {
      if (view !== "month") return null;
      const availableSlots = getAvailableSlotsForDay(date);
      return availableSlots.length > 0 ? (
        <div className="text-xs text-green-600">
          {availableSlots.length} slots
        </div>
      ) : null;
    },
    [getAvailableSlotsForDay]
  );

  const handleDateClick = useCallback(
    (date) => {
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
      }
    },
    [getAvailableSlotsForDay, selectedSlots]
  );

  const handleSlotToggle = (slot) => {
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
    const newSelectedSlots = selectedDaySlots.filter((s) => s.isSelected);
    setSelectedSlots((prev) => [
      ...prev.filter(
        (s) => s.date.toDateString() !== currentDay.toDateString()
      ),
      ...newSelectedSlots,
    ]);
    setSlotModalOpen(false);
  };

  const handleBookingConfirm = async () => {
    if (!user || selectedSlots.length === 0) return;
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

      const coach = coaches.find((c) => c._id === selectedCoach);
      const bookingPromises = mergedBookings.map((slot) => {
        const endTime = new Date(slot.date);
        endTime.setHours(parseInt(slot.endTime.split(":")[0]), 0, 0, 0);
        const bookingData = {
          playerId: mongoUserId,
          coachId: selectedCoach === "no-coach" ? null : coach?.userId,
          day: slot.day,
          startTime: slot.date.toISOString(),
          endTime: endTime.toISOString(),
          ballMachine,
          status: "pending",
          totalCost: calculateCostBreakdown({
            slots: [slot],
            coach,
            settings,
            ballMachine,
          }).total,
          createdAt: new Date().toISOString(),
        };
        return fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });
      });

      const responses = await Promise.all(bookingPromises);
      const bookingIds = [];
      for (const res of responses) {
        if (!res.ok) throw new Error("Failed to save booking");
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
    if (!pendingBookingIds.length) return;
    try {
      const costBreakdown = calculateCostBreakdown({
        slots: selectedSlots,
        coach: coaches.find((c) => c._id === selectedCoach),
        settings,
        ballMachine,
      });

      await initiatePayment(
        pendingBookingIds,
        costBreakdown.total,
        `Payment for ${selectedSlots.length} bookings`,
        mongoUserId
      );
    } catch (err) {
      console.error("Payment confirm error:", err.message);
      setPaymentModalOpen(false);
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;

  return (
    <>
      <Toaster position="top-center" /> {/* Add Toaster component */}
      {user ? (
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
                              new Date(slot.date).setHours(
                                slot.date.getHours() + 1
                              )
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

          <BookingModals
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            paymentModalOpen={paymentModalOpen}
            setPaymentModalOpen={setPaymentModalOpen}
            slotModalOpen={slotModalOpen}
            setSlotModalOpen={setSlotModalOpen}
            selectedSlots={selectedSlots}
            selectedDaySlots={selectedDaySlots}
            currentDay={currentDay}
            handleSlotToggle={handleSlotToggle}
            confirmSlotSelection={confirmSlotSelection}
            handleBookingConfirm={handleBookingConfirm}
            handlePaymentConfirm={handlePaymentConfirm}
            coaches={coaches}
            selectedCoach={selectedCoach}
            settings={settings}
            ballMachine={ballMachine}
            paymentError={paymentError}
            isProcessing={isProcessing}
          />
        </main>
      ) : null}
    </>
  );
}
