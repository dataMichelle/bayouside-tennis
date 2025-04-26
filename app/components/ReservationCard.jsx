import { formatTimeTo12HourCDT } from "@/utils/time";

export default function ReservationCard({
  booking,
  coach,
  isProcessing,
  onPayNow,
}) {
  // Use stored cost breakdown, defaulting to 0 for older bookings
  const costBreakdown = booking.costBreakdown || {
    coachFee: 0,
    courtFee: 0,
    machineFee: 0,
  };
  const totalCost = booking.totalCost || 0;

  return (
    <li className="border-b pb-2">
      <p>
        <strong>Date:</strong>{" "}
        {new Date(booking.startTime).toLocaleDateString("en-US", {
          timeZone: "America/Chicago",
        })}
      </p>
      <p>
        <strong>Time:</strong> {formatTimeTo12HourCDT(booking.startTime)} -{" "}
        {formatTimeTo12HourCDT(booking.endTime)} CDT
      </p>
      <p>
        <strong>Coach:</strong> {coach?.name || booking.coachName || "No Coach"}
      </p>
      <p>
        <strong>Ball Machine:</strong> {booking.ballMachine ? "Yes" : "No"}
      </p>
      <div>
        <strong>Cost Breakdown:</strong>
        <ul className="list-none ml-4">
          <li>Coach Fee: ${costBreakdown.coachFee.toFixed(2)}</li>
          <li>Court Rental: ${costBreakdown.courtFee.toFixed(2)}</li>
          <li>Ball Machine: ${costBreakdown.machineFee.toFixed(2)}</li>
          <li>
            <strong>Total: ${totalCost.toFixed(2)}</strong>
          </li>
        </ul>
      </div>
      <p>
        <strong>Status:</strong>{" "}
        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        {booking.status === "pending" && (
          <button
            onClick={onPayNow}
            className="ml-4 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </button>
        )}
      </p>
    </li>
  );
}
