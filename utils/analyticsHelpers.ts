// utils/analyticsHelpers.ts
import { SleepEntry } from "@/types/sleep";

export interface DayData {
  date: string; // "Mon", "Jan", etc.
  fullDate: string; // "2026-08-04" or "Jan 2025"
  totalHours: number; // total sleep in that period (daily or monthly)
  daysInPeriod: number; // how many days this bar represents (1 for day, 28‑31 for month)
}

export interface WeeklyStats {
  avgHours: number;
  bestDay: { date: string; hours: number };
  worstDay: { date: string; hours: number };
  nightsWithSleep: number; // how many of the 7 days had sleep
}

export function getLast7DaysData(entries: SleepEntry[]): DayData[] {
  const result: DayData[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue

    const total = entries
      .filter((e) => e.date === dateStr && e.wakeTime !== null)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    result.push({
      date: dayLabel,
      fullDate: dateStr,
      totalHours: Math.round(total * 10) / 10,
      daysInPeriod: 1, // ← new
    });
  }

  return result;
}

export interface WeeklyStats {
  avgHours: number;
  bestDay: { date: string; hours: number };
  worstDay: { date: string; hours: number };
  nightsWithSleep: number;
  consistency: number;
}

export function getWeeklyStatsFromData(data: DayData[]): WeeklyStats {
  const daysWithSleep = data.filter((d) => d.totalHours > 0);

  if (daysWithSleep.length === 0) {
    return {
      avgHours: 0,
      bestDay: { date: "", hours: 0 },
      worstDay: { date: "", hours: 0 },
      nightsWithSleep: 0,
      consistency: 0,
    };
  }

  const totalHours = daysWithSleep.reduce((s, d) => s + d.totalHours, 0);
  const avgHours = Math.round((totalHours / daysWithSleep.length) * 10) / 10;
  const best = daysWithSleep.reduce((max, d) =>
    d.totalHours > max.totalHours ? d : max,
  );
  const worst = daysWithSleep.reduce((min, d) =>
    d.totalHours < min.totalHours ? d : min,
  );

  // ---- Consistency calculation ----
  // Standard deviation
  const variance =
    daysWithSleep.reduce(
      (sum, d) => sum + Math.pow(d.totalHours - avgHours, 2),
      0,
    ) / daysWithSleep.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV) = stdDev / avg
  // If avg is 0 (shouldn't happen here), consistency = 0
  const cv = avgHours > 0 ? stdDev / avgHours : 0;

  // Turn into a percentage where 100% = all nights identical
  const consistency = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  // -------------------------------------------------

  return {
    avgHours,
    bestDay: { date: best.date, hours: best.totalHours },
    worstDay: { date: worst.date, hours: worst.totalHours },
    nightsWithSleep: daysWithSleep.length,
    consistency,
  };
}

export interface ScheduleConsistency {
  consistentNights: number;
  totalNights: number;
}

export function getScheduleConsistency(
  entries: SleepEntry[],
): ScheduleConsistency {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // 1. Keep only completed entries from the last 7 days
  const recent = entries.filter((e) => {
    if (!e.wakeTime) return false;
    const date = new Date(e.date);
    return date >= sevenDaysAgo && date <= now;
  });

  if (recent.length === 0) return { consistentNights: 0, totalNights: 0 };

  // 2. Group by date, pick the longest sleep (primary sleep)
  const byDate: Record<string, SleepEntry> = {};
  recent.forEach((e) => {
    if (!byDate[e.date] || (e.duration || 0) > (byDate[e.date].duration || 0)) {
      byDate[e.date] = e;
    }
  });

  const primarySleeps = Object.values(byDate);
  const totalNights = primarySleeps.length;

  if (totalNights < 2) {
    // Not enough data to compute a meaningful average
    return { consistentNights: 0, totalNights };
  }

  // 3. Convert bedtime / wake time to minutes from midnight (local time)
  const bedTimes = primarySleeps.map((e) => {
    const d = new Date(e.sleepTime); // local parse already fixed
    return d.getHours() * 60 + d.getMinutes();
  });
  const wakeTimes = primarySleeps.map((e) => {
    const d = new Date(e.wakeTime!);
    return d.getHours() * 60 + d.getMinutes();
  });

  const avgBed = bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length;
  const avgWake = wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length;

  // 4. Count how many nights both bed & wake are within 30 min of average
  const TOLERANCE = 30; // minutes
  const consistentNights = primarySleeps.filter((_, i) => {
    const bedDiff = Math.abs(bedTimes[i] - avgBed);
    const wakeDiff = Math.abs(wakeTimes[i] - avgWake);
    return bedDiff <= TOLERANCE && wakeDiff <= TOLERANCE;
  }).length;

  return { consistentNights, totalNights };
}

export interface MonthSummary {
  month: string;
  totalHours: number;
  avgHours: number;
  nights: number;
}

export function getMonthlySummary(
  entries: SleepEntry[],
  monthsBack: number,
): MonthSummary[] {
  const now = new Date();
  const months: MonthSummary[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const monthEntries = entries.filter((e) => {
      const date = new Date(e.sleepTime);
      return (
        date.getFullYear() === d.getFullYear() &&
        date.getMonth() === d.getMonth()
      );
    });

    const completed = monthEntries.filter((e) => e.wakeTime !== null);
    const total = completed.reduce((sum, e) => sum + (e.duration || 0), 0);
    const nights = completed.length;

    if (nights === 0) continue; // skip empty months

    const avg = Math.round((total / nights) * 10) / 10;
    months.push({
      month: monthLabel,
      totalHours: Math.round(total * 10) / 10,
      avgHours: avg,
      nights,
    });
  }

  return months.reverse(); // most recent first
}

export function getLast30DaysData(entries: SleepEntry[]): DayData[] {
  const result: DayData[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue

    const total = entries
      .filter((e) => e.date === dateStr && e.wakeTime !== null)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    result.push({
      date: dayLabel,
      fullDate: dateStr,
      totalHours: Math.round(total * 10) / 10,
      daysInPeriod: 1, // ← add this line
    });
  }

  return result;
}

// ---------- Fixed getLast12MonthsData ----------
export function getLast12MonthsData(entries: SleepEntry[]): DayData[] {
  const result: DayData[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed

    const monthEntries = entries.filter((e) => {
      const date = new Date(e.sleepTime);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    const completed = monthEntries.filter((e) => e.wakeTime !== null);
    const total = completed.reduce((sum, e) => sum + (e.duration || 0), 0);
    const nights = completed.length;

    if (nights === 0) continue; // skip months with no data

    const daysInMonth = new Date(year, month + 1, 0).getDate(); // e.g., 31

    result.push({
      date: d.toLocaleDateString("en-US", { month: "short" }), // "Jan"
      fullDate: d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }), // "Jan 2025"
      totalHours: Math.round(total * 10) / 10, // total hours in the month
      daysInPeriod: daysInMonth,
    });
  }

  return result;
}

// ---------- Fixed getAllMonthsData ----------
export function getAllMonthsData(entries: SleepEntry[]): DayData[] {
  if (entries.length === 0) return [];

  // Find earliest entry date (YYYY-MM-DD)
  const dates = entries.map((e) => e.date);
  dates.sort();
  const earliestStr = dates[0];

  const result: DayData[] = [];
  const [earliestYear, earliestMonth] = earliestStr.split("-").map(Number);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  let year = earliestYear;
  let month = earliestMonth - 1; // 0-indexed

  while (
    year < currentYear ||
    (year === currentYear && month <= currentMonth)
  ) {
    const labelDate = new Date(year, month, 1);

    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const completed = monthEntries.filter((e) => e.wakeTime !== null);
    const total = completed.reduce((sum, e) => sum + (e.duration || 0), 0);
    const nights = completed.length;

    if (nights === 0) {
      // Move to next month before continuing
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      continue;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate(); // e.g., 31

    result.push({
      date: labelDate.toLocaleDateString("en-US", { month: "short" }),
      fullDate: labelDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      totalHours: Math.round(total * 10) / 10,
      daysInPeriod: daysInMonth,
    });

    // Next month
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return result;
}

// ---- Daily stats (used for Week / Month tabs) ----
export interface DailyStats {
  avgHours: number; // average hours per night
  bestDay: { date: string; hours: number };
  worstDay: { date: string; hours: number };
}

export function getDailyStats(data: DayData[]): DailyStats {
  const daysWithSleep = data.filter((d) => d.totalHours > 0);
  if (daysWithSleep.length === 0) {
    return {
      avgHours: 0,
      bestDay: { date: "", hours: 0 },
      worstDay: { date: "", hours: 0 },
    };
  }
  const total = daysWithSleep.reduce((s, d) => s + d.totalHours, 0);
  const avg = Math.round((total / daysWithSleep.length) * 10) / 10;
  const best = daysWithSleep.reduce((max, d) =>
    d.totalHours > max.totalHours ? d : max,
  );
  const worst = daysWithSleep.reduce((min, d) =>
    d.totalHours < min.totalHours ? d : min,
  );
  return {
    avgHours: avg,
    bestDay: { date: best.date, hours: best.totalHours },
    worstDay: { date: worst.date, hours: worst.totalHours },
  };
}

// ---- Monthly stats (used for Year / All tabs) ----
export interface MonthlyStats {
  avgHours: number; // average of monthly averages
  bestMonth: { date: string; hours: number };
  worstMonth: { date: string; hours: number };
  monthsTracked: number;
  targetPercent: number; // average % of 7h/day target
}

export function getMonthlyStats(data: DayData[]): MonthlyStats {
  const monthsWithSleep = data.filter((d) => d.totalHours > 0);
  if (monthsWithSleep.length === 0) {
    return {
      avgHours: 0,
      bestMonth: { date: "", hours: 0 },
      worstMonth: { date: "", hours: 0 },
      monthsTracked: 0,
      targetPercent: 0,
    };
  }

  const TARGET_HOURS_PER_DAY = 7;
  let sumOfAverages = 0;
  let totalPercent = 0;
  let best = { date: "", hours: 0 };
  let worst = { date: "", hours: Infinity };

  for (const month of monthsWithSleep) {
    const avg = month.totalHours / month.daysInPeriod;
    sumOfAverages += avg;
    const idealTotal = month.daysInPeriod * TARGET_HOURS_PER_DAY;
    const percent = (month.totalHours / idealTotal) * 100;
    totalPercent += percent;
    if (avg > best.hours)
      best = { date: month.date, hours: Math.round(avg * 10) / 10 };
    if (avg < worst.hours)
      worst = { date: month.date, hours: Math.round(avg * 10) / 10 };
  }

  const avgOfAverages =
    Math.round((sumOfAverages / monthsWithSleep.length) * 10) / 10;
  const avgTargetPercent = Math.round(totalPercent / monthsWithSleep.length);
  return {
    avgHours: avgOfAverages,
    bestMonth: best,
    worstMonth: worst,
    monthsTracked: monthsWithSleep.length,
    targetPercent: avgTargetPercent,
  };
}

export interface SleepTimePoint {
  date: string; // "Mon", "Jan 2026", etc.
  fullDate: string; // "2026-08-14" or "Jan 2026"
  bedtime: number | null; // minutes from midnight (0‑1439)
  wakeTime: number | null;
}

// Helper to convert Date to minutes from midnight
function toMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

// Computes daily bedtime/wake‑up points for last N days
export function getDailySleepTimes(
  entries: SleepEntry[],
  days: number,
): SleepTimePoint[] {
  const result: SleepTimePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

    // Find the longest sleep entry for this date (primary sleep)
    const entriesForDate = entries.filter(
      (e) => e.date === dateStr && e.wakeTime,
    );
    let bedtime: number | null = null;
    let wakeTime: number | null = null;
    if (entriesForDate.length > 0) {
      const primary = entriesForDate.reduce((max, e) =>
        (e.duration ?? 0) > (max.duration ?? 0) ? e : max,
      );
      bedtime = toMinutes(new Date(primary.sleepTime));
      wakeTime = toMinutes(new Date(primary.wakeTime!));
    }
    result.push({ date: dayLabel, fullDate: dateStr, bedtime, wakeTime });
  }
  return result;
}

// Computes monthly average bedtime/wake‑up for last N months
export function getMonthlySleepTimes(
  entries: SleepEntry[],
  monthsBack: number,
): SleepTimePoint[] {
  const result: SleepTimePoint[] = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEntries = entries.filter((e) => {
      const date = new Date(e.date);
      return (
        date.getFullYear() === d.getFullYear() &&
        date.getMonth() === d.getMonth()
      );
    });
    let bedSum = 0,
      wakeSum = 0,
      count = 0;
    for (const entry of monthEntries) {
      if (!entry.wakeTime) continue;
      bedSum += toMinutes(new Date(entry.sleepTime));
      wakeSum += toMinutes(new Date(entry.wakeTime));
      count++;
    }
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    result.push({
      date: label,
      fullDate: label,
      bedtime: count > 0 ? Math.round(bedSum / count) : null,
      wakeTime: count > 0 ? Math.round(wakeSum / count) : null,
    });
  }
  return result;
}
