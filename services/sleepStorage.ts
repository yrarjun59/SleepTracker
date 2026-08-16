import { SleepEntry } from "@/types/sleep";
import { calculateDuration } from "@/utils/calculations";
import { parseLocalDateTime, toLocalISOString } from "@/utils/dateHelpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
const STORAGE_KEY = "@sleep_entries";
const INCOMPLETE_KEY = "@incomplete_sleep";

function generateId(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${datePart}T${timePart}`;
}

// ---------- Helpers ----------
async function getAll(): Promise<SleepEntry[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

async function saveAll(entries: SleepEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ---------- Public API ----------
export async function getAllEntries(): Promise<SleepEntry[]> {
  return getAll();
}

export async function getIncompleteEntry(): Promise<SleepEntry | null> {
  const json = await AsyncStorage.getItem(INCOMPLETE_KEY);
  return json ? JSON.parse(json) : null;
}

export async function startSleep(): Promise<SleepEntry> {
  const now = toLocalISOString(new Date());
  const entry: SleepEntry = {
    id: generateId(),
    date: now.split("T")[0],
    sleepTime: now,
    wakeTime: null,
    duration: null,
    source: "live",
    createdAt: now,
  };

  await AsyncStorage.setItem(INCOMPLETE_KEY, JSON.stringify(entry));
  return entry;
}

export async function addManualEntry(
  entry: Omit<SleepEntry, "id" | "createdAt">,
): Promise<SleepEntry> {
  const newEntry: SleepEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  const all = await getAll();
  all.unshift(newEntry);
  await saveAll(all);
  return newEntry;
}
export async function deleteEntry(id: string): Promise<void> {
  const all = await getAll();
  const filtered = all.filter((e) => e.id !== id);
  await saveAll(filtered);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, INCOMPLETE_KEY]);
}

export async function abortSleep(): Promise<void> {
  await AsyncStorage.removeItem(INCOMPLETE_KEY);
}

export async function finishSleep(): Promise<SleepEntry | null> {
  const incomplete = await getIncompleteEntry();
  if (!incomplete) return null;

  const sleepStart = parseLocalDateTime(incomplete.sleepTime).getTime();
  const elapsedMinutes = Math.floor((Date.now() - sleepStart) / 60000);

  if (elapsedMinutes < 10) {
    throw new Error("MINIMUM_DURATION");
  }

  const wakeTime = toLocalISOString(new Date());
  const duration = calculateDuration(incomplete.sleepTime, wakeTime);

  const completed: SleepEntry = {
    ...incomplete,
    wakeTime,
    duration,
  };

  const all = await getAll();
  all.unshift(completed);
  await saveAll(all);

  await AsyncStorage.removeItem(INCOMPLETE_KEY);

  return completed;
}
