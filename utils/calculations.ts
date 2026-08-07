import { SleepEntry } from "@/types/sleep";
import { parseLocalDateTime } from "./dateHelpers";

export function calculateDuration(sleepTime: string, wakeTime: string): number {
  const sleep = parseLocalDateTime(sleepTime).getTime();
  const wake = parseLocalDateTime(wakeTime).getTime();
  const diffMs = wake - sleep;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

export function getWeeklyAverage(
  entries: SleepEntry[],
  weekOffset = 0,
  minDays = 6, // 👈 new parameter
): number | null {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + weekOffset * 7);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);

  const weekEntries = entries.filter((entry) => {
    if (!entry.duration) return false;
    const d = new Date(entry.date);
    return d >= startDate && d < endDate;
  });

  // Require a minimum number of distinct days with sleep
  const uniqueDays = new Set(weekEntries.map((e) => e.date)).size;
  if (uniqueDays < minDays) return null;

  const total = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  return Math.round((total / 7) * 10) / 10; // still average over 7 days
}

export function getDifferenceInMinutes(
  thisWeek: number,
  lastWeek: number,
): number {
  return Math.round((thisWeek - lastWeek) * 60);
}
