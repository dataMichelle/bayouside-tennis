"use client";

import { createContext, useContext, useState, useCallback } from "react";

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const initiatePayment = useCallback(
    async (bookingIds, amount, description, userId) => {
      if (
        !Array.isArray(bookingIds) ||
        bookingIds.some((id) => !id || typeof id !== "string")
      ) {
        console.error("Invalid booking IDs:", bookingIds);
        throw new Error("Invalid booking IDs");
      }
      if (!amount || typeof amount !== "number" || amount <= 0) {
        console.error("Invalid amount:", amount);
        throw new Error("Invalid amount");
      }
      if (!description || typeof description !== "string") {
        console.error("Invalid description:", description);
        throw new Error("Invalid description");
      }
      if (!userId || typeof userId !== "string") {
        console.error("Invalid userId:", userId);
        throw new Error("Invalid userId");
      }

      try {
        setIsProcessing(true);
        setError(null);
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingIds,
            amount,
            description,
            userId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Stripe checkout response error:", errorText);
          throw new Error(errorText);
        }

        const data = await response.json();
        window.location.href = data.sessionUrl;
      } catch (err) {
        console.error("Payment initiation failed:", err.message);
        setError(err.message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const verifyPayments = useCallback(async (bookingIds) => {
    try {
      const res = await fetch("/api/stripe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Stripe verify response error:", errorText);
        throw new Error(`Failed to verify payments: ${errorText}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error verifying payments:", err.message);
      throw err;
    }
  }, []);

  return (
    <PaymentContext.Provider
      value={{ initiatePayment, verifyPayments, isProcessing, error }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  return useContext(PaymentContext);
}
