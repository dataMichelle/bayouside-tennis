export const formatTimeTo12HourCDT = (time) => {
  if (!time) return "";
  const date = new Date(time);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Chicago",
  });
};
