"use client";

import { createContext, useContext, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { verifyPayments } from "@/lib/verifyPayments";

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async (bookingIds, amount, description, userId) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!bookingIds?.length || amount <= 0 || !userId || !description) {
        throw new Error(
          `Invalid payment parameters: ${JSON.stringify({
            bookingIds,
            amount,
            userId,
            description,
          })}`
        );
      }

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
        throw new Error(
          data.error || `Payment failed with status ${response.status}`
        );
      }

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      );
      if (!stripe) throw new Error("Failed to load Stripe");

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) throw new Error(stripeError.message);
    } catch (err) {
      console.error("Initiate payment error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{ initiatePayment, verifyPayments, error, isProcessing }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  return useContext(PaymentContext);
}
