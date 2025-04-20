// app/lib/verifyPayments.js

export async function verifyPayments(bookingIds) {
  try {
    if (!bookingIds || bookingIds.length === 0) {
      console.warn("No bookingIds passed to verifyPayments");
      return { missingPayments: [], allVerified: true };
    }

    const query = bookingIds.map((id) => `bookingId=${id}`).join("&");
    const res = await fetch(`/api/payments?${query}`);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to verify payments: ${errorText}`);
    }

    const payments = await res.json();

    const paidIds = Array.isArray(payments)
      ? payments.map((p) => p.bookingId?.toString())
      : payments?.bookingId
      ? [payments.bookingId?.toString()]
      : [];

    const missingPayments = bookingIds.filter((id) => !paidIds.includes(id));
    return { missingPayments, allVerified: missingPayments.length === 0 };
  } catch (err) {
    console.error("Error verifying payments:", {
      error: err,
      message: err?.message || "Unknown error",
      stack: err?.stack || "no stack trace",
      bookingIds,
    });
    return { missingPayments: bookingIds, allVerified: false };
  }
}
