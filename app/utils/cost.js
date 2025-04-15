export function calculateCostBreakdown({ booking, coach, settings }) {
  const coachRate = coach?.rate ? parseFloat(coach.rate) : 30;
  const courtRate = settings?.courtRentalCost || 20;
  const ballMachineRate = booking?.ballMachine
    ? settings?.ballMachineCost || 40
    : 0;

  const hours =
    (new Date(booking.endTime) - new Date(booking.startTime)) /
    (1000 * 60 * 60);

  const coachFee = coachRate * hours;
  const courtRental = courtRate * hours;
  const ballMachine = ballMachineRate * hours;
  const total = coachFee + courtRental + ballMachine;

  return {
    coachFee,
    courtRental,
    ballMachine,
    total,
  };
}
