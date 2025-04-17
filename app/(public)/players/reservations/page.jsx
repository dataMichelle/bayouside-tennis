// app/(public)/players/reservations/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { usePayment, PaymentProvider } from "@/context/PaymentContext";
import PageContainer from "@/components/PageContainer";
import ReservationCard from "@/components/ReservationCard";

function ReservationsContent() {
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
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setError("Not authenticated");
      router.push("/login");
      setLoading(false);
      return;
    }

    console.log("Reservations - Auth user:", {
      firebaseUid: user.uid,
      email: user.email,
    });

    const fetchData = async () => {
      try {
        // Fetch MongoDB _id
        const userRes = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        if (!userRes.ok) {
          console.error(
            "Reservations - Failed to fetch user:",
            await userRes.text()
          );
          throw new Error("Failed to fetch user data");
        }
        const userData = await userRes.json();
        const mongoUserId = userData._id;
        console.log("Reservations - MongoDB user _id:", mongoUserId);

        const [bookingsRes, coachesRes, settingsRes] = await Promise.all([
          fetch(`/api/bookings?userId=${mongoUserId}`),
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
        console.error("Reservations - Error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userLoading, router]);

  const handlePayNow = async (booking) => {
    try {
      console.log("PayNow - Booking:", booking._id, "Firebase UID:", user.uid);
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
        console.error("PayNow - Payment failed:", await paymentRes.text());
        return;
      }

      await confirmBookings([booking._id]);

      const userRes = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      if (!userRes.ok) throw new Error("Failed to fetch user data");
      const userData = await userRes.json();
      const mongoUserId = userData._id;

      const updatedBookings = await fetch(
        `/api/bookings?userId=${mongoUserId}`
      ).then((res) => res.json());
      setBookings(
        updatedBookings.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        )
      );
    } catch (err) {
      console.error("PayNow - Error:", err);
      setError(paymentError || err.message);
    }
  };

  if (loading || userLoading)
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
