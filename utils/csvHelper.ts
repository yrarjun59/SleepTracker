// utils/csvHelper.ts
import { SleepEntry } from "@/types/sleep";

// CSV header
const HEADER = "date,sleepTime,wakeTime,duration,source";

/**
 * Convert an array of SleepEntry to CSV string
 */
export function entriesToCSV(entries: SleepEntry[]): string {
  const rows = [HEADER];
  for (const entry of entries) {
    const row = [
      entry.date,
      entry.sleepTime,
      entry.wakeTime ?? "",
      entry.duration?.toString() ?? "",
      entry.source,
    ].join(",");
    rows.push(row);
  }
  return rows.join("\n");
}

/**
 * Parse a CSV string and return an array of partial SleepEntry objects (no id/createdAt).
 * Throws on invalid rows.
 */
// utils/csvHelper.ts (updated parseCSV function)

export function parseCSV(
  csv: string,
): Array<Omit<SleepEntry, "id" | "createdAt">> {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) throw new Error("Empty CSV file");

  // Header must contain at least the first three columns
  const header = lines[0].trim();
  if (!header.startsWith("date,sleepTime,wakeTime"))
    throw new Error(
      `Invalid CSV header. Expected at least: date,sleepTime,wakeTime`,
    );

  const entries: Array<Omit<SleepEntry, "id" | "createdAt">> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const cols = parseCSVLine(line);
    if (cols.length < 3)
      throw new Error(
        `Row ${i + 1}: expected at least 3 columns (date,sleepTime,wakeTime)`,
      );

    const date = cols[0];
    const sleepTime = cols[1];
    const wakeTime = cols[2] || null;
    const durationStr = cols[3] || "";
    const source = (cols[4] || "manual") as "live" | "manual";

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Error(`Row ${i + 1}: invalid date format (use YYYY-MM-DD)`);

    // sleepTime is required
    if (!sleepTime) throw new Error(`Row ${i + 1}: missing sleepTime`);

    // Duration: use provided value or calculate from sleep/wake times
    let duration: number | null = null;
    if (durationStr) {
      duration = parseFloat(durationStr);
      if (isNaN(duration)) throw new Error(`Row ${i + 1}: invalid duration`);
    } else if (wakeTime) {
      // Calculate duration in hours from the two local ISO strings
      const sleepMs = new Date(sleepTime).getTime();
      const wakeMs = new Date(wakeTime).getTime();
      duration =
        Math.round(((wakeMs - sleepMs) / (1000 * 60 * 60)) * 100) / 100;
    }
    entries.push({
      date,
      sleepTime,
      wakeTime: wakeTime || null,
      duration,
      source,
    });
  }

  return entries;
}

// parseCSVLine function stays identical

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
