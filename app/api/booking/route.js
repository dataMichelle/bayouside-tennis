"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayment } from "@/context/PaymentContext";
import { useUser } from "@/context/UserContext";
import PageContainer from "@/components/PageContainer";
import ReservationCard from "@/components/ReservationCard";

export default function ReservationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyPayments, initiatePayment } = usePayment();
  const { firebaseUser, userData, loading } = useUser();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [retries, setRetries] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const maxRetries = 5;

  const fetchData = useCallback(async () => {
    if (!userData?.id) {
      setFetchError("User ID not available");
      return;
    }
    try {
      const res = await fetch(
        `/api/player/reservations?playerId=${userData.id}`
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const bookingsArray = Array.isArray(data.bookings) ? data.bookings : [];
      const validBookings = bookingsArray.filter(
        (b) => b.startTime && b.endTime && b._id
      );

      setBookings(validBookings);
      setFetchError(null);
    } catch (err) {
      setBookings([]);
      setFetchError(err.message);
    }
  }, [userData]);

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [loading, firebaseUser, router, fetchData]);

  const handlePayNow = async (booking) => {
    setIsProcessing(true);
    setPaymentError(null);
    try {
      if (!firebaseUser) throw new Error("User not authenticated");
      await initiatePayment(
        [booking._id],
        booking.totalCost,
        `Booking for ${booking.day}`,
        userData?.id
      );
    } catch (err) {
      setPaymentError("Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageContainer title="Your Reservations">
      {loading && <p>Loading...</p>}
      {!loading && !firebaseUser && <p>Please log in to view reservations.</p>}
      {!loading && firebaseUser && (
        <>
          {paymentStatus === "success" && (
            <p className="text-green-600">Payment confirmed!</p>
          )}
          {paymentStatus === "pending" && (
            <p className="text-yellow-600">
              Waiting for payment confirmation...
            </p>
          )}
          {paymentStatus === "failed" && (
            <p className="text-red-600">
              Payment verification failed. Please contact support.
            </p>
          )}
          {fetchError && <p className="text-red-600">Error: {fetchError}</p>}
          {bookings.length === 0 && !fetchError && (
            <p>No reservations found.</p>
          )}
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <ReservationCard
                key={booking._id}
                booking={booking}
                coach={booking.coach || null}
                settings={{}} // Use default if needed or fetch settings separately
                onPayNow={handlePayNow}
                isProcessing={isProcessing}
                paymentError={paymentError}
              />
            ))}
          </ul>
        </>
      )}
    </PageContainer>
  );
}
