"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { usePayment, PaymentProvider } from "@/context/PaymentContext";
import PageContainer from "@/components/PageContainer";
import ReservationCard from "@/components/ReservationCard";

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
          const [bookingsRes, coachesRes, settingsRes] = await Promise.all([
            fetch(`/api/bookings?userId=${currentUser.uid}`),
            fetch("/api/coach"),
            fetch("/api/settings"),
          ]);

          if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");
          if (!coachesRes.ok) throw new Error("Failed to fetch coaches");
          if (!settingsRes.ok) throw new Error("Failed to fetch settings");

          const [bookingsData, coachesData, settingsData] = await Promise.all([
            bookingsRes.json(),
            coachesRes.json(),
            settingsRes.json(),
          ]);

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

  const handlePayNow = async (booking) => {
    try {
      const paymentIntent = await initiatePayment(
        [booking._id],
        booking.totalCost,
        `Payment for booking on ${new Date(
          booking.startTime
        ).toLocaleDateString()}`,
        user.uid
      );

      const paymentData = {
        bookingId: booking._id,
        userId: user.uid,
        amount: Math.round(booking.totalCost * 100),
        currency: "USD",
        stripePaymentId: paymentIntent?.id || "fallback_" + Date.now(),
      };

      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!paymentRes.ok) {
        console.error("Payment failed:", await paymentRes.text());
        return;
      }

      await confirmBookings([booking._id]);

      const updatedBookings = await fetch(
        `/api/bookings?userId=${user.uid}`
      ).then((res) => res.json());
      setBookings(
        updatedBookings.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        )
      );
    } catch (err) {
      console.error("Payment error:", err);
      setError(paymentError || err.message);
    }
  };

  if (loading)
    return (
      <PageContainer title="My Reservations">
        <p>Loading...</p>
      </PageContainer>
    );
  if (error)
    return (
      <PageContainer title="My Reservations">
        <p className="text-red-500">{error}</p>
      </PageContainer>
    );

  return (
    <PageContainer title="My Reservations">
      {bookings.length > 0 ? (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <ReservationCard
              key={booking._id}
              booking={booking}
              coach={coaches.find((c) => c.userId === booking.coachId)}
              settings={settings}
              onPayNow={handlePayNow}
              isProcessing={isProcessing}
              paymentError={paymentError}
            />
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No reservations found.</p>
      )}
    </PageContainer>
  );
}

export default function PlayerReservations() {
  return (
    <PaymentProvider>
      <ReservationsContent />
    </PaymentProvider>
  );
}
