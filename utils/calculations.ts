import { SleepEntry } from "@/types/sleep";

export function calculateDuration(sleepTime: string, wakeTime: string): number {
  const sleep = new Date(sleepTime).getTime();
  const wake = new Date(wakeTime).getTime();
  const diffMs = wake - sleep;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

export function getWeeklyAverage(
  entries: SleepEntry[],
  weekOffset = 0,
): number | null {
  const now = new Date();

  // End of range: for offset=0 → today; for offset=-1 → 7 days ago
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + weekOffset * 7);

  // Start of range: 7 days before endDate
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);

  // Group total sleep per day
  const dailyTotals: Record<string, number> = {};

  entries.forEach((entry) => {
    if (!entry.duration) return;
    const d = new Date(entry.date);
    if (d >= startDate && d < endDate) {
      const dateKey = entry.date;
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + entry.duration;
    }
  });

  // Average over the 7‑day window (days with no entries = 0)
  const sum = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
  const avg = sum / 7;
  return Math.round(avg * 10) / 10;
}

export function getDifferenceInMinutes(
  thisWeek: number,
  lastWeek: number,
): number {
  return Math.round((thisWeek - lastWeek) * 60);
}
