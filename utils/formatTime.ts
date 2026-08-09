import { useSettings } from "@/contexts/SettingsContext";

/**
 * Returns a function that formats a Date (or any reasonable input) according to the user's chosen time format.
 * Safe to call with null / undefined / invalid dates – returns "--:--" in those cases.
 */
export function useFormattedTime() {
  const { timeFormat } = useSettings();

  return (date: any) => {
    // Convert strings to Date if possible
    if (typeof date === "string") {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      } else {
        return "--:--";
      }
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "--:--";
    }

    if (timeFormat === "24h") {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
}
