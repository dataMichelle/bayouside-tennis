// app/context/PaymentContext.jsx
"use client";

import { createContext, useContext, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async (bookingIds, amount, description) => {
    setIsProcessing(true);
    setError(null);
    try {
      const stripe = await stripePromise;
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingIds,
          amount: amount * 100, // Convert to cents
          currency: "usd",
          description,
        }),
      });
      if (!response.ok) throw new Error("Failed to create Stripe session");
      const { sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });
      if (result.error) throw new Error(result.error.message);
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      throw err; // Let the caller handle the error if needed
    }
  };

  const confirmBookings = async (bookingIds) => {
    try {
      const updatePromises = bookingIds.map((id) =>
        fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "confirmed" }),
        })
      );
      const responses = await Promise.all(updatePromises);
      for (const res of responses) {
        if (!res.ok)
          throw new Error(`Failed to confirm booking: ${res.statusText}`);
      }
    } catch (err) {
      setError(err.message);
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
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context)
    throw new Error("usePayment must be used within a PaymentProvider");
  return context;
};
