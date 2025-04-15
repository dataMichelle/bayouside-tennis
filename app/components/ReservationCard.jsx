import { calculateCostBreakdown } from "@/utils/cost";
import { formatTimeTo12HourCDT } from "@/utils/time";

export default function ReservationCard({
  booking,
  coach,
  settings,
  onPayNow,
  isProcessing,
  paymentError,
}) {
  const { coachFee, courtRental, ballMachine, total } = calculateCostBreakdown({
    booking,
    coach,
    settings,
  });

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
        <strong>Coach:</strong> {coach ? coach.name : "No Coach"}
      </p>
      <p>
        <strong>Ball Machine:</strong> {booking.ballMachine ? "Yes" : "No"}
      </p>
      <div>
        <strong>Cost Breakdown:</strong>
        <ul className="list-none ml-4">
          <li>Coach Fee: ${coachFee.toFixed(2)}</li>
          <li>Court Rental: ${courtRental.toFixed(2)}</li>
          <li>Ball Machine: ${ballMachine.toFixed(2)}</li>
          <li>
            <strong>Total: ${total.toFixed(2)}</strong>
          </li>
        </ul>
      </div>
      <p>
        <strong>Status:</strong> {booking.status}
        {booking.status === "pending" && (
          <button
            onClick={() => onPayNow(booking)}
            className="ml-4 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </button>
        )}
      </p>
      {paymentError && booking.status === "pending" && (
        <p className="text-red-500 mt-1">{paymentError}</p>
      )}
    </li>
  );
}
