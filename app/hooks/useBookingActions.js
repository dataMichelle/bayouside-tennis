// hooks/useBookingActions.js

import { usePayment } from "@/context/PaymentContext";

const useBookingLogic = () => {
  const { initiatePayment, confirmBookings } = usePayment();

  const confirmBooking = async (bookingIds) => {
    try {
      await confirmBookings(bookingIds);
      return { success: true };
    } catch (err) {
      console.error("Error confirming bookings:", err);
      return { success: false, message: err.message };
    }
  };

  const initiateStripeCheckout = async ({
    bookingIds,
    amount,
    description,
    userId,
  }) => {
    try {
      const intent = await initiatePayment(
        bookingIds,
        amount,
        description,
        userId
      );
      return { success: true, intent };
    } catch (err) {
      console.error("Error initiating payment:", err);
      return { success: false, message: err.message };
    }
  };

  return {
    confirmBooking,
    initiateStripeCheckout,
  };
};

export default useBookingLogic;
