"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { usePayment } from "@/context/PaymentContext";
import PageContainer from "@/components/PageContainer";
import ReservationCard from "@/components/ReservationCard";

export default function ReservationsPage() {
  const { firebaseUser, userData, loading: userLoading } = useUser();
  const { verifyPayments, initiatePayment } = usePayment();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [isProcessingId, setIsProcessingId] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Fetch current reservations for this user
  const fetchReservations = useCallback(async () => {
    if (!userData?.id) {
      console.warn("Skipping fetchReservations: userData.id is undefined");
      return;
    }
    try {
      console.log("Fetching reservations for user ID:", userData.id);
      const res = await fetch(
        `/api/player/reservations?playerId=${userData.id}`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log("Fetched reservations:", data.bookings);
      setBookings(data.bookings || []);
      setFetchError(null);
    } catch (err) {
      console.error("Error loading reservations:", err.message);
      setFetchError(err.message);
    }
  }, [userData]);

  // Pay Now logic
  const handlePayNow = async (booking) => {
    if (!booking._id || booking._id === "null") {
      console.warn("Invalid booking ID for payment");
      return;
    }

    const id =
      typeof booking._id === "object" ? booking._id.toString() : booking._id;
    console.log("Booking ID being sent to Stripe for Pay Now:", id);

    setIsProcessingId(id);
    try {
      await initiatePayment(
        [id],
        booking.totalCost,
        `Booking for ${
          booking.day || new Date(booking.startTime).toLocaleDateString()
        }`,
        userData.id
      );
    } catch (err) {
      console.error("Payment initiation failed:", err.message);
    } finally {
      setIsProcessingId(null);
    }
  };

  // Verifies payment completion (triggered by Stripe redirect)
  const verifyAndRefresh = useCallback(async () => {
    const success = searchParams.get("success");
    const rawIds = searchParams.get("bookingIds");

    if (success === "true" && rawIds) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawIds));
        const validIds = Array.isArray(parsed)
          ? parsed.filter((id) => typeof id === "string" && id !== "null")
          : [];
        console.log("Verifying payment IDs:", validIds);

        if (validIds.length > 0) {
          const response = await verifyPayments(validIds);
          console.log("Payment verification response:", response);
          if (response.allVerified) {
            console.log("All payments verified, refreshing reservations");
            await fetchReservations();
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("success");
            newParams.delete("bookingIds");
            router.replace(`/players/reservations?${newParams.toString()}`);
          } else {
            console.warn("Not all payments were verified");
            setFetchError(
              "Some payments could not be verified. Please try again."
            );
            await fetchReservations();
          }
        } else {
          console.warn("No valid booking IDs to verify");
          setFetchError("Invalid booking IDs provided.");
        }
      } catch (err) {
        console.error("Error verifying payment IDs:", err.message);
        setFetchError(`Failed to verify payments: ${err.message}`);
        await fetchReservations();
      }
    }
  }, [searchParams, verifyPayments, fetchReservations, router]);

  // Load reservations when user data is ready
  useEffect(() => {
    if (firebaseUser && userData?.id) {
      console.log("User data ready, fetching reservations:", {
        userId: userData.id,
      });
      fetchReservations();
    } else {
      console.log("Waiting for user data:", { firebaseUser, userData });
    }
  }, [firebaseUser, userData?.id, fetchReservations]);

  // Watch for Stripe success redirects
  useEffect(() => {
    if (userData?.id) {
      console.log("Running verifyAndRefresh with user ID:", userData.id);
      verifyAndRefresh();
    } else {
      console.log("Skipping verifyAndRefresh: userData.id is undefined");
    }
  }, [verifyAndRefresh, userData?.id]);

  if (userLoading) {
    return (
      <PageContainer title="Reservations">
        <p>Loading user data...</p>
      </PageContainer>
    );
  }

  if (!firebaseUser) {
    return (
      <PageContainer title="Reservations">
        <p>Please log in to view your reservations.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Your Reservations">
      {fetchError && <p className="text-red-600">Error: {fetchError}</p>}
      {bookings.length === 0 && !fetchError && <p>No reservations found.</p>}
      <ul className="space-y-4">
        {bookings.map((booking) => (
          <ReservationCard
            key={booking._id}
            booking={booking}
            coach={booking.coach || null}
            onPayNow={() => handlePayNow(booking)}
            isProcessing={isProcessingId === booking._id}
          />
        ))}
      </ul>
    </PageContainer>
  );
}
