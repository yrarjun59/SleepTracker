export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDuration(hours: number | null): string {
  if (hours === null || hours === undefined) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function getDateLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function getWeekRange(offset = 0): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export function getElapsedTime(startIso: string): string {
  const start = new Date(startIso).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function getElapsedMinutes(startIso: string): number {
  const start = new Date(startIso).getTime();
  return Math.floor((Date.now() - start) / 60000);
}