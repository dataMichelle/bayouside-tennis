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
  const [bookings, setBookings] = useState([]);
  const [isProcessingId, setIsProcessingId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [fetchError, setFetchError] = useState(null);

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

  const verifyUpdatedStatuses = useCallback(async () => {
    const pending = bookings.filter((b) => b.status === "pending");
    if (pending.length === 0) return;

    const bookingIds = pending.map((b) => b._id?.toString()).filter(Boolean);
    if (bookingIds.length === 0) return;

    const { missingPayments, allVerified } = await verifyPayments(bookingIds);
    if (allVerified) {
      console.log("All pending bookings now confirmed");
      setBookings((prev) =>
        prev.map((b) =>
          bookingIds.includes(b._id) ? { ...b, status: "confirmed" } : b
        )
      );
    }
  }, [bookings, verifyPayments]);

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [loading, firebaseUser, router, fetchData]);

  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      verifyUpdatedStatuses();
    }
  }, [searchParams, verifyUpdatedStatuses]);

  const handlePayNow = async (booking) => {
    setIsProcessingId(booking._id);
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
      setIsProcessingId(null);
    }
  };

  return (
    <PageContainer title="Your Reservations">
      {loading && <p>Loading...</p>}
      {!loading && !firebaseUser && <p>Please log in to view reservations.</p>}
      {!loading && firebaseUser && (
        <>
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
                settings={{}}
                onPayNow={handlePayNow}
                isProcessing={isProcessingId === booking._id}
                paymentError={paymentError}
              />
            ))}
          </ul>
        </>
      )}
    </PageContainer>
  );
}
