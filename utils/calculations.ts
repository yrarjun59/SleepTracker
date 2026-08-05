import { SleepEntry } from "@/types/sleep";
import { getWeekRange } from "@/utils/dateHelpers";

export function calculateDuration(sleepTime: string, wakeTime: string): number {
  const sleep = new Date(sleepTime).getTime();
  const wake = new Date(wakeTime).getTime();
  const diffMs = wake - sleep;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // hours with 2 decimals
}

export function getWeeklyAverage(entries: SleepEntry[], weekOffset = 0): number {
  const { start, end } = getWeekRange(weekOffset);

  const weekEntries = entries.filter((entry) => {
    if (!entry.duration) return false;
    const d = new Date(entry.date);
    return d >= start && d <= end;
  });

  if (weekEntries.length === 0) return 0;

  const total = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  return Math.round((total / weekEntries.length) * 10) / 10;
}

export function getDifferenceInMinutes(thisWeek: number, lastWeek: number): number {
  return Math.round((thisWeek - lastWeek) * 60);
}