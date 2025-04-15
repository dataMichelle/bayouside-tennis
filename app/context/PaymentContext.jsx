"use client";

import { createContext, useState, useContext } from "react";
import { loadStripe } from "@stripe/stripe-js";

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async (bookingIds, amount, description, userId) => {
    setIsProcessing(true);
    setError(null);
    try {
      console.log("Initiating Stripe checkout:", {
        bookingIds,
        amount,
        description,
        userId,
      });
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingIds,
          userId,
          amount,
          currency: "USD",
          description,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Stripe checkout failed:", data);
        throw new Error(data.error || "Failed to initiate payment");
      }

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      );
      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        throw new Error(stripeError.message);
      }

      console.log("Stripe checkout initiated:", data);
      return data;
    } catch (err) {
      console.error("Initiate payment error:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmBookings = async (bookingIds) => {
    try {
      console.log("Confirming bookings:", bookingIds);
      const confirmPromises = bookingIds.map((id) =>
        fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "confirmed" }),
        })
      );

      const responses = await Promise.all(confirmPromises);
      for (const res of responses) {
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Confirm booking error:", errorData);
          throw new Error(errorData.error || "Failed to confirm booking");
        }
      }
      console.log("Bookings confirmed successfully:", bookingIds);
      return { success: true };
    } catch (err) {
      console.error("Confirm bookings error:", err);
      throw err;
    }
  };

  return (
    <PaymentContext.Provider
      value={{ initiatePayment, confirmBookings, error, isProcessing }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  return useContext(PaymentContext);
}
