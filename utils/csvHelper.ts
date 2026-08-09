import { SleepEntry } from "@/types/sleep";


function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Parse a human-friendly date string back to an ISO local string (YYYY-MM-DDTHH:MM:SS).
 * Example input: "Aug 9, 2026 10:15 PM"
 */
function parseFormattedDateTime(str: string): string {
  const cleaned = str.replace(",", "");
  const parts = cleaned.split(" ");
  if (parts.length < 5) throw new Error(`Invalid date/time: ${str}`);

  const monthStr = parts[0]; // "Aug"
  const day = parts[1]; // "9"
  const year = parts[2]; // "2026"
  const time = parts[3]; // "10:15"
  const ampm = parts[4]; // "PM"

  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const month = monthMap[monthStr];
  if (month === undefined) throw new Error(`Invalid month: ${monthStr}`);

  let [hour, minute] = time.split(":").map(Number);
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const d = new Date(Number(year), month, Number(day), hour, minute, 0, 0);
  // Convert to local ISO string (no Z)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
}

// ---------- Export ----------
export function entriesToCSV(entries: SleepEntry[]): string {
  const header = "sleepTime,wakeTime";
  const rows = [header];
  for (const entry of entries) {
    const sleepStr = formatDateTime(new Date(entry.sleepTime));
    const wakeStr = entry.wakeTime
      ? formatDateTime(new Date(entry.wakeTime))
      : "";
    rows.push(`"${sleepStr}","${wakeStr}"`);
  }
  return rows.join("\n");
}

// ---------- Import ----------
export function parseCSV(
  csv: string,
): Array<Omit<SleepEntry, "id" | "createdAt">> {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) throw new Error("Empty CSV file");

  const header = lines[0].trim();
  const entries: Array<Omit<SleepEntry, "id" | "createdAt">> = [];

  // New two-column format: sleepTime,wakeTime
  if (header === "sleepTime,wakeTime") {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const cols = parseCSVLine(line);
      if (cols.length < 2)
        throw new Error(
          `Row ${i + 1}: expected 2 columns (sleepTime,wakeTime)`,
        );

      const sleepTime = parseFormattedDateTime(cols[0]);
      const wakeTime = cols[1] ? parseFormattedDateTime(cols[1]) : null;

      const sleepMs = new Date(sleepTime).getTime();
      const wakeMs = wakeTime ? new Date(wakeTime).getTime() : null;
      const duration = wakeMs
        ? Math.round(((wakeMs - sleepMs) / (1000 * 60 * 60)) * 100) / 100
        : null;

      const date = sleepTime.split("T")[0]; // YYYY-MM-DD

      entries.push({
        date,
        sleepTime,
        wakeTime,
        duration,
        source: "manual",
      });
    }
    return entries;
  }

  // Legacy five-column format: date,sleepTime,wakeTime,duration,source
  if (header === "date,sleepTime,wakeTime,duration,source") {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const cols = parseCSVLine(line);
      if (cols.length < 3)
        throw new Error(`Row ${i + 1}: expected at least 3 columns`);

      const date = cols[0];
      const sleepTime = cols[1];
      const wakeTime = cols[2] || null;
      const durationStr = cols[3] || "";
      const source = (cols[4] || "manual") as "live" | "manual";

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`Row ${i + 1}: invalid date`);
      if (!sleepTime) throw new Error(`Row ${i + 1}: missing sleepTime`);

      let duration: number | null = null;
      if (durationStr) {
        duration = parseFloat(durationStr);
        if (isNaN(duration)) throw new Error(`Row ${i + 1}: invalid duration`);
      } else if (wakeTime) {
        const sleepMs = new Date(sleepTime).getTime();
        const wakeMs = new Date(wakeTime).getTime();
        duration =
          Math.round(((wakeMs - sleepMs) / (1000 * 60 * 60)) * 100) / 100;
      }

      entries.push({ date, sleepTime, wakeTime, duration, source });
    }
    return entries;
  }

  throw new Error(`Unknown CSV header: ${header}`);
}

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
