export function calculateCostBreakdown({
  slots,
  coach,
  settings,
  ballMachine,
}) {
  // Default to 1 hour if slots is undefined or not an array
  const hours = Array.isArray(slots) && slots.length > 0 ? slots.length : 1;
  const coachRate = coach?.rate ? parseFloat(coach.rate) : 0;
  const courtRentalCost = settings?.courtRentalCost
    ? parseFloat(settings.courtRentalCost)
    : 20;
  const ballMachineCost =
    ballMachine && settings?.ballMachineCost
      ? parseFloat(settings.ballMachineCost)
      : 0;

  const coachFee = coachRate * hours;
  const courtFee = courtRentalCost * hours;
  const machineFee = ballMachineCost * hours;
  const total = coachFee + courtFee + machineFee;

  return { coachFee, courtFee, machineFee, total };
}
