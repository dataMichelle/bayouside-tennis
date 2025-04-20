"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { usePayment } from "@/context/PaymentContext";
import PageContainer from "@/components/PageContainer";
import BookingModals from "@/components/BookingModals";
import { calculateCostBreakdown } from "@/utils/cost";

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [mongoUserId, setMongoUserId] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState({
    courtRentalCost: 20,
    ballMachineCost: 40,
    coachFeeSplitPercentage: 60,
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
    confirmBookings,
    error: paymentError,
    isProcessing,
  } = usePayment();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRes = await fetch("/api/users", {
            headers: {
              Authorization: `Bearer ${await currentUser.getIdToken()}`,
            },
          });
          if (!userRes.ok) {
            const errorText = await userRes.text();
            throw new Error(`Failed to fetch user data: ${errorText}`);
          }
          const userData = await userRes.json();
          setMongoUserId(userData._id);

          const [coachRes, bookingsRes, settingsRes] = await Promise.all([
            fetch("/api/coach"),
            fetch(`/api/player/reservations?playerId=${userData._id}`),
            fetch("/api/settings"),
          ]);

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
                settingsRes.status
              } ${await settingsRes.text()}`
            );

          const coachData = await coachRes.json();
          const bookingsData = await bookingsRes.json();
          const settingsData = await settingsRes.json();

          setCoaches(coachData);
          setBookings(bookingsData.bookings || []);
          setSettings(settingsData);
        } catch (err) {
          console.error("BookingPage fetch error:", err.message);
          setError(err.message);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [confirmBookings, router, searchParams]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const generateHourlySlots = useCallback((startTime, endTime, day, date) => {
    const start = parseInt(startTime.split(":")[0], 10);
    const end = parseInt(endTime.split(":")[0], 10);
    const slots = [];
    for (let hour = start; hour < end; hour++) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      slots.push({
        day,
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
        date: slotDate,
      });
    }
    console.log(
      `Generated ${slots.length} slots for ${day} on ${date.toDateString()}`
    );
    return slots;
  }, []);

  const getAvailableSlotsForDay = useCallback(
    (date) => {
      if (!selectedCoach) {
        console.log("No coach selected, returning empty slots");
        return [];
      }
      const coach = coaches.find((c) => c._id === selectedCoach) || {
        availability: [],
      };
      const availability = Array.isArray(coach.availability)
        ? coach.availability
        : [];
      const dayName = date.toLocaleString("en-US", { weekday: "long" });
      const daySlots = availability.find((a) => a.day === dayName);
      if (!daySlots) {
        console.log(
          `No availability for ${dayName} for coach ${selectedCoach}`
        );
        return [];
      }

      const allSlots = generateHourlySlots(
        daySlots.startTime,
        daySlots.endTime,
        dayName,
        date
      );
      const availableSlots = allSlots.filter((slot) => {
        return !bookings.some((b) => {
          const sameCoach =
            b.coachId === (coach.userId || null) ||
            (!b.coachId && selectedCoach === "no-coach");
          const bookingStart = new Date(b.startTime);
          const bookingEnd = new Date(b.endTime);
          const slotStart = new Date(slot.date);
          const slotEnd = new Date(slot.date);
          slotEnd.setHours(slotEnd.getHours() + 1);
          const timeOverlap =
            (bookingStart <= slotStart && slotStart < bookingEnd) ||
            (bookingStart < slotEnd && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && bookingEnd <= slotEnd);
          return sameCoach && timeOverlap;
        });
      });
      console.log(
        `Available slots for ${dayName} on ${date.toDateString()}: ${
          availableSlots.length
        }`
      );
      return availableSlots;
    },
    [coaches, bookings, selectedCoach, generateHourlySlots]
  );

  const tileContent = useCallback(
    ({ date, view }) => {
      if (view !== "month" || !selectedCoach) return null;
      const slots = getAvailableSlotsForDay(date);
      return slots.length ? (
        <span className="text-xs text-green-500">{slots.length} slots</span>
      ) : null;
    },
    [getAvailableSlotsForDay, selectedCoach]
  );

  const handleDateClick = useCallback(
    (date) => {
      if (!selectedCoach) {
        console.log("No coach selected, cannot select date");
        return;
      }
      const available = getAvailableSlotsForDay(date);
      console.log(
        `Handle date click: ${date.toDateString()}, available slots: ${
          available.length
        }`
      );
      if (!available.length) return;

      setCurrentDay(date);
      setSelectedDaySlots(
        available.map((slot) => ({
          ...slot,
          isSelected: selectedSlots.some(
            (s) =>
              s.date.toISOString() === slot.date.toISOString() &&
              s.startTime === slot.startTime
          ),
        }))
      );
      setSlotModalOpen(true);
    },
    [getAvailableSlotsForDay, selectedSlots]
  );

  const handleSlotToggle = (slot) => {
    console.log(
      `Toggling slot: ${slot.startTime} on ${slot.date.toDateString()}`
    );
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
    const newSelected = selectedDaySlots.filter((s) => s.isSelected);
    console.log(
      `Confirming ${
        newSelected.length
      } selected slots for ${currentDay.toDateString()}`
    );
    setSelectedSlots((prev) => [
      ...prev.filter(
        (s) => s.date.toDateString() !== currentDay.toDateString()
      ),
      ...newSelected,
    ]);
    setSlotModalOpen(false);
  };

  const handleBookingConfirm = async () => {
    if (!mongoUserId || !selectedSlots.length) {
      const errMsg = !mongoUserId
        ? "User ID not available"
        : "No slots selected";
      console.error(errMsg);
      setError(errMsg);
      return;
    }
    try {
      console.log(
        `Submitting ${selectedSlots.length} bookings for userId: ${mongoUserId}`
      );
      const coach = coaches.find((c) => c._id === selectedCoach);
      const coachId =
        coach && coach.userId && selectedCoach !== "no-coach"
          ? coach.userId
          : null;

      const bookingPayloads = selectedSlots.map((slot) => {
        const end = new Date(slot.date);
        end.setHours(parseInt(slot.endTime.split(":")[0]), 0, 0, 0);

        return {
          playerId: mongoUserId,
          coachId: coachId,
          day: slot.day,
          startTime: slot.date.toISOString(),
          endTime: end.toISOString(),
          ballMachine,
          totalCost: calculateCostBreakdown({
            slots: [slot],
            coach: coach,
            settings,
            ballMachine,
          }).total,
          createdAt: new Date().toISOString(),
        };
      });

      console.log("Booking payloads:", bookingPayloads);

      const responses = await Promise.all(
        bookingPayloads.map((payload) =>
          fetch("/api/booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        )
      );

      const ids = [];
      for (const res of responses) {
        const errorText = !res.ok ? await res.text() : null;
        if (!res.ok) {
          console.error("Booking failed:", errorText);
          throw new Error(`Booking failed: ${errorText}`);
        }
        const data = await res.json();
        ids.push(data.id);
      }

      console.log("Bookings saved, IDs:", ids);
      setPendingBookingIds(ids);
      setModalOpen(false);
      setPaymentModalOpen(true);
    } catch (err) {
      console.error("Booking confirm error:", err.message);
      setError(err.message);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!user || !mongoUserId) {
      console.error("User or MongoDB userId not available for payment");
      setError("Please log in to complete payment");
      return;
    }
    try {
      const coach = coaches.find((c) => c._id === selectedCoach);
      const totalCost = calculateCostBreakdown({
        slots: selectedSlots,
        coach: coach,
        settings,
        ballMachine,
      }).total;
      if (totalCost <= 0 || !pendingBookingIds.length) {
        console.error("Invalid payment parameters:", {
          totalCost,
          pendingBookingIds,
        });
        throw new Error("Invalid payment amount or booking IDs");
      }
      console.log(
        `Initiating payment for ${pendingBookingIds.length} bookings, total: $${totalCost}, userId: ${mongoUserId}`
      );
      // Store totalCost for webhook
      localStorage.setItem("totalCost", totalCost.toString());
      await initiatePayment(
        pendingBookingIds,
        totalCost,
        `Booking for ${selectedSlots.length} slots`,
        mongoUserId // Use MongoDB _id
      );
    } catch (err) {
      console.error("Payment confirm error:", err.message);
      setPaymentModalOpen(false);
      setError(err.message);
    }
  };

  const cost = calculateCostBreakdown({
    slots: selectedSlots,
    coach: coaches.find((c) => c._id === selectedCoach),
    settings,
    ballMachine,
  });

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user)
    return <div className="p-6 text-center">Please log in to book.</div>;
  if (error)
    return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  return (
    <PageContainer title="Booking Page">
      <form className="bg-swamp-200 p-6 rounded-lg shadow max-w-3xl mx-auto space-y-6">
        <div>
          <label className="block font-medium mb-1">Select Coach</label>
          <select
            value={selectedCoach}
            onChange={(e) => {
              setSelectedCoach(e.target.value);
              setSelectedSlots([]);
              console.log("Selected coach:", e.target.value);
            }}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Choose Coach --</option>
            <option value="no-coach">No Coach</option>
            {coaches.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCoach && (
          <div className="flex justify-center">
            <Calendar
              onChange={setCalendarDate}
              value={calendarDate}
              tileContent={tileContent}
              onClickDay={handleDateClick}
            />
          </div>
        )}

        <div>
          <h3 className="font-medium">Selected Slots:</h3>
          {selectedSlots.length > 0 ? (
            <ul className="list-disc pl-5">
              {selectedSlots.map((slot, index) => (
                <li key={index}>
                  {slot.day} {slot.date.toLocaleDateString()} {slot.startTime} -{" "}
                  {slot.endTime}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No slots selected.</p>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={ballMachine}
              onChange={() => {
                setBallMachine(!ballMachine);
                console.log("Ball machine toggled:", !ballMachine);
              }}
              className="mr-2"
            />
            Rent Ball Machine
          </label>
          <button
            type="button"
            onClick={() => {
              console.log(
                "Opening confirmation modal, selected slots:",
                selectedSlots.length
              );
              setModalOpen(true);
            }}
            disabled={!selectedSlots.length}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Book Selected Slots
          </button>
        </div>
      </form>

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
    </PageContainer>
  );
}
