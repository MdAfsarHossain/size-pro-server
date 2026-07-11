export function formatDate(isoString: any) {
  const date = new Date(isoString);

  // Format date part
  const datePart = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Format time part
  // const timePart = date.toLocaleString("en-US", {
  //   hour: "numeric",
  //   minute: "2-digit",
  //   hour12: true,
  // });

  // return `${timePart}, ${datePart}`;
  // return `${datePart} & ${timePart}`;
  return `${datePart}`;
}

export function formatDateAndTimeV1(isoString: any) {
  const date = new Date(isoString);

  // Format date part
  const datePart = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Format time part
  const timePart = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${timePart}, ${datePart}`;
  // return `${datePart} & ${timePart}`;
  // return `${datePart}`;
}

export function formatDateAndTime(isoString: any, timezone?: string) {
  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  };

  const formatted = date.toLocaleString("en-US", options);

  // Rearrange to "time, date" format: e.g. "12:23 AM, Jul 12, 2026"
  // toLocaleString returns e.g. "Jul 12, 2026, 12:23 AM" — split on last comma before AM/PM
  const match = formatted.match(/^(.+),\s*(\d{1,2}:\d{2}\s*[AP]M)$/);
  if (match) {
    return `${match[2]}, ${match[1]}`;
  }

  return formatted;
}

export const formatDateForSubscription = (isoDateString: string): string => {
  const date = new Date(isoDateString);

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  // Add ordinal suffix to day (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};
