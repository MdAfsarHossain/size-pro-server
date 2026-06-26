export const convertToAmPmWithDate = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
