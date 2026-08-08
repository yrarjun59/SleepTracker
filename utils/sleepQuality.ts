// utils/sleepQuality.ts

export type SleepQuality = "None" | "Low" | "Fair" | "Good" | "Long";

export function getSleepQuality(duration: number | null): SleepQuality {
  if (duration === null || duration === 0) return "None";
  if (duration < 6) return "Low";
  if (duration < 7) return "Fair";
  if (duration <= 9) return "Good";
  return "Long";
}

export const SLEEP_QUALITY_COLORS: Record<SleepQuality, string> = {
  None: "transparent",
  Low: "#FF6B6B", // soft red
  Fair: "#FFD93D", // yellow
  Good: "#6BCB77", // green
  Long: "#4D96FF", // blue
};

export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  None: "",
  Low: "Low",
  Fair: "Fair",
  Good: "Good",
  Long: "Long",
};
