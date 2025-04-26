export function calculateCostBreakdown({
  slots,
  coach,
  settings,
  ballMachine,
}) {
  // Initialize fee variables
  let coachFee = 0;
  let courtFee = 0;
  let machineFee = 0;

  // Validate inputs and log for debugging
  if (!settings || typeof settings !== "object") {
    console.warn("calculateCostBreakdown: Invalid settings object", settings);
    throw new Error("Settings object is required");
  }
  if (!Array.isArray(slots) || slots.length === 0) {
    console.warn("calculateCostBreakdown: Invalid or empty slots array", slots);
    return { total: 0, coachFee: 0, courtFee: 0, machineFee: 0 };
  }

  // Process each slot
  slots.forEach((slot, index) => {
    // Calculate duration in hours
    let startTime, endTime;
    if (slot.startTime && slot.endTime) {
      // Backend format: slots have startTime and endTime as ISO strings
      startTime = new Date(slot.startTime);
      endTime = new Date(slot.endTime);
    } else if (slot.date && slot.endTime) {
      // Frontend format: slots have date (Date object) and endTime (string like "HH:00")
      startTime = new Date(slot.date);
      endTime = new Date(slot.date);
      const [hours] = slot.endTime.split(":");
      endTime.setHours(parseInt(hours, 10), 0, 0, 0);
    } else {
      // Default to 1-hour slot
      console.warn(
        `calculateCostBreakdown: Invalid slot time at index ${index}`,
        slot
      );
      startTime = new Date(slot.date || new Date());
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }

    // Ensure valid duration
    const duration = (endTime - startTime) / (1000 * 60 * 60) || 1;
    if (duration <= 0) {
      console.warn(
        `calculateCostBreakdown: Invalid duration for slot at index ${index}`,
        { startTime, endTime, duration }
      );
    }

    // Calculate fees
    coachFee += coach && coach.rate ? coach.rate * duration : 0;
    courtFee += settings.courtRentalCost
      ? settings.courtRentalCost * duration
      : 0;
    machineFee +=
      ballMachine && settings.ballMachineCost
        ? settings.ballMachineCost * duration
        : 0;
  });

  // Calculate total
  const total = coachFee + courtFee + machineFee;

  // Return formatted breakdown
  return {
    total: parseFloat(total.toFixed(2)),
    coachFee: parseFloat(coachFee.toFixed(2)),
    courtFee: parseFloat(courtFee.toFixed(2)),
    machineFee: parseFloat(machineFee.toFixed(2)),
  };
}
