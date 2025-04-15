"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usePayment, PaymentProvider } from "@/context/PaymentContext";
import { useRouter } from "next/navigation";

function ReservationsContent() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [settings, setSettings] = useState({
    courtRentalCost: 0,
    ballMachineCost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    initiatePayment,
    confirmBookings,
    error: paymentError,
    isProcessing,
  } = usePayment();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const [bookingsResponse, coachesResponse, settingsResponse] =
            await Promise.all([
              fetch(`/api/bookings?userId=${currentUser.uid}`),
              fetch("/api/coach"),
              fetch("/api/settings"),
            ]);
          if (!bookingsResponse.ok) throw new Error("Failed to fetch bookings");
          if (!coachesResponse.ok) throw new Error("Failed to fetch coaches");
          if (!settingsResponse.ok) throw new Error("Failed to fetch settings");
          const bookingsData = await bookingsResponse.json();
          const coachesData = await coachesResponse.json();
          const settingsData = await settingsResponse.json();

          console.log("Bookings:", JSON.stringify(bookingsData, null, 2));
          console.log("Coaches:", JSON.stringify(coachesData, null, 2));
          console.log("Settings:", settingsData);

          setBookings(
            bookingsData.sort(
              (a, b) => new Date(a.startTime) - new Date(b.startTime)
            )
          );
          setCoaches(coachesData);
          setSettings(settingsData);
        } catch (err) {
          setError(err.message);
        }
      } else {
        setError("Not authenticated");
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

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

  const calculateCostBreakdown = (booking) => {
    const coach = coaches.find((c) => c._id === booking.coachId);
    const coachRate = coach && coach.rate ? parseFloat(coach.rate) : 0;
    const courtCost = settings.courtRentalCost || 20;
    const ballMachineCost = booking.ballMachine
      ? settings.ballMachineCost || 40
      : 0;
    const hours =
      (new Date(booking.endTime) - new Date(booking.startTime)) /
      (1000 * 60 * 60);
    return {
      coachFee: coachRate * hours,
      courtRental: courtCost * hours,
      ballMachine: ballMachineCost * hours,
      total:
        booking.totalCost || (coachRate + courtCost + ballMachineCost) * hours,
    };
  };

  const handlePayNow = async (booking) => {
    try {
      console.log("Initiating payment for booking:", booking._id);
      const paymentIntent = await initiatePayment(
        [booking._id],
        booking.totalCost,
        `Payment for booking on ${new Date(
          booking.startTime
        ).toLocaleDateString()}`,
        user.uid
      );
      console.log("Payment initiated:", paymentIntent);

      // Fallback: Save payment
      const paymentData = {
        bookingId: booking._id,
        userId: user.uid,
        amount: Math.round(booking.totalCost * 100),
        currency: "USD",
        stripePaymentId: paymentIntent?.id || "fallback_" + Date.now(),
      };
      console.log("Saving fallback payment:", paymentData);
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!paymentResponse.ok) {
        console.error("Fallback payment failed:", await paymentResponse.text());
      } else {
        console.log("Fallback payment saved:", await paymentResponse.json());
      }

      // Fallback: Confirm booking
      console.log("Confirming booking:", booking._id);
      await confirmBookings([booking._id]);

      // Refresh bookings
      const verifyResponse = await fetch(`/api/bookings?userId=${user.uid}`);
      if (!verifyResponse.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const updatedBookings = await verifyResponse.json();
      const updatedBooking = updatedBookings.find((b) => b._id === booking._id);
      if (updatedBooking.status !== "confirmed") {
        console.warn("Booking not confirmed:", updatedBooking);
      }
      console.log("Booking status:", updatedBooking);

      setBookings(
        updatedBookings.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        )
      );
    } catch (err) {
      console.error("Payment error:", err);
      setError(paymentError || `Payment failed: ${err.message}`);
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error)
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
        My Reservations
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-primary-600 mb-4">
          Your Bookings
        </h2>
        {bookings.length > 0 ? (
          <ul className="space-y-4">
            {bookings.map((booking) => {
              const coach = coaches.find((c) => c._id === booking.coachId);
              const costBreakdown = calculateCostBreakdown(booking);
              console.log(
                "Booking coachId:",
                booking.coachId,
                "Found coach:",
                coach,
                "Cost breakdown:",
                costBreakdown
              );
              return (
                <li key={booking._id} className="border-b pb-2">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(booking.startTime).toLocaleDateString("en-US", {
                      timeZone: "America/Chicago",
                    })}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {formatTimeTo12HourCDT(booking.startTime)} -{" "}
                    {formatTimeTo12HourCDT(booking.endTime)} CDT
                  </p>
                  <p>
                    <strong>Coach:</strong> {coach ? coach.name : "No Coach"}
                  </p>
                  <p>
                    <strong>Ball Machine:</strong>{" "}
                    {booking.ballMachine ? "Yes" : "No"}
                  </p>
                  <div>
                    <strong>Cost Breakdown:</strong>
                    <ul className="list-none ml-4">
                      <li>Coach Fee: ${costBreakdown.coachFee.toFixed(2)}</li>
                      <li>
                        Court Rental: ${costBreakdown.courtRental.toFixed(2)}
                      </li>
                      <li>
                        Ball Machine: ${costBreakdown.ballMachine.toFixed(2)}
                      </li>
                      <li>
                        <strong>
                          Total: ${costBreakdown.total.toFixed(2)}
                        </strong>
                      </li>
                    </ul>
                  </div>
                  <p>
                    <strong>Status:</strong> {booking.status}
                    {booking.status === "pending" && (
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="ml-4 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : "Pay Now"}
                      </button>
                    )}
                  </p>
                  {paymentError && booking.status === "pending" && (
                    <p className="text-red-500 mt-1">{paymentError}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600">No reservations found.</p>
        )}
      </div>
    </div>
  );
}

export default function PlayerReservations() {
  return (
    <PaymentProvider>
      <ReservationsContent />
    </PaymentProvider>
  );
}
