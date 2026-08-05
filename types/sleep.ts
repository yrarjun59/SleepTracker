export type SleepSource = "live" | "manual";

export interface SleepEntry {
  id: string;
  date: string;               // "YYYY-MM-DD"
  sleepTime: string;          // ISO
  wakeTime: string | null;    // null while still sleeping
  duration: number | null;    // hours
  source: SleepSource;
  createdAt: string;
}