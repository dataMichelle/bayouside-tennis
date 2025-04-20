"use client";

import { createContext, useContext, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

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
          amount, // Pass in dollars
          currency: "USD",
          description,
        }),
      });

      console.log("Stripe checkout response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
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
      console.error("Initiate payment error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayments = async (bookingIds, userId, totalCost) => {
    try {
      console.log("Verifying payments for bookingIds:", bookingIds);
      const payments = await Promise.all(
        bookingIds.map(async (bookingId) => {
          const response = await fetch(`/api/payments?bookingId=${bookingId}`);
          return response.ok ? await response.json() : null;
        })
      );
      const missingPayments = bookingIds.filter((_, i) => !payments[i]);
      console.log("Payment verification result:", {
        bookingIds,
        missingPayments,
      });

      return { missingPayments, allVerified: missingPayments.length === 0 };
    } catch (err) {
      console.error("Error verifying payments:", {
        error: err.message,
        stack: err.stack,
      });
      return { missingPayments: bookingIds, allVerified: false };
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
