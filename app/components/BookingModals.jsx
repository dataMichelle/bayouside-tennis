"use client";

import { calculateCostBreakdown } from "@/utils/cost";

export default function BookingModals({
  modalOpen,
  setModalOpen,
  paymentModalOpen,
  setPaymentModalOpen,
  slotModalOpen,
  setSlotModalOpen,
  selectedSlots,
  selectedDaySlots,
  currentDay,
  handleSlotToggle,
  confirmSlotSelection,
  handleBookingConfirm,
  handlePaymentConfirm,
  coaches,
  selectedCoach,
  settings,
  ballMachine,
  paymentError,
  isProcessing,
}) {
  const formatTimeTo12HourCDT = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    });
  };

  const cost = calculateCostBreakdown({
    slots: selectedSlots,
    coach: coaches.find((c) => c._id === selectedCoach),
    settings,
    ballMachine,
  });

  return (
    <>
      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
            <p>
              {selectedCoach === "no-coach"
                ? "No Coach"
                : `Coach: ${
                    coaches.find((c) => c._id === selectedCoach)?.name ||
                    "Unknown"
                  }`}
            </p>
            <ul className="mb-4">
              {selectedSlots.map((slot, index) => (
                <li key={index}>
                  {slot.day} {slot.date.toLocaleDateString()}:{" "}
                  {formatTimeTo12HourCDT(slot.date)} -{" "}
                  {formatTimeTo12HourCDT(
                    new Date(slot.date).setHours(slot.date.getHours() + 1)
                  )}
                </li>
              ))}
            </ul>
            <p>Ball Machine: {ballMachine ? "Yes" : "No"}</p>
            <div className="mt-2">
              <h3 className="font-semibold">Cost Breakdown</h3>
              <ul className="list-none">
                <li>Coach Fee: ${cost.coachFee.toFixed(2)}</li>
                <li>Court Rental: ${cost.courtFee.toFixed(2)}</li>
                <li>Ball Machine: ${cost.machineFee.toFixed(2)}</li>
                <li className="font-semibold mt-2">
                  Total: ${cost.total.toFixed(2)}
                </li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Selection Modal */}
      {slotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setSlotModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              Select Slots for {currentDay?.toLocaleDateString()} (CDT)
            </h2>
            <div className="space-y-2">
              {selectedDaySlots.map((slot, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`day-slot-${index}`}
                    checked={slot.isSelected}
                    onChange={() => handleSlotToggle(slot)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`day-slot-${index}`}
                    className="text-neutrals-700 dark:text-neutrals-300"
                  >
                    {formatTimeTo12HourCDT(slot.date)} -{" "}
                    {formatTimeTo12HourCDT(
                      new Date(slot.date).setHours(slot.date.getHours() + 1)
                    )}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setSlotModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSlotSelection}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Payment Required</h2>
            <p>Booking saved as pending. Complete payment to confirm.</p>
            <p className="mt-2 font-semibold">
              Total: ${cost.total.toFixed(2)}
            </p>
            {paymentError && (
              <p className="text-red-500 mt-2">{paymentError}</p>
            )}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pay with Stripe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
