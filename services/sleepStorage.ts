import AsyncStorage from "@react-native-async-storage/async-storage";
import { SleepEntry } from "@/types/sleep";
import { calculateDuration } from "@/utils/calculations";


const STORAGE_KEY = "@sleep_entries";
const INCOMPLETE_KEY = "@incomplete_sleep";

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
  const now = new Date().toISOString();
  const entry: SleepEntry = {
    id: Date.now().toString(),
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


export async function addManualEntry(entry: Omit<SleepEntry, "id" | "createdAt">): Promise<SleepEntry> {
  const newEntry: SleepEntry = {
    ...entry,
    id: Date.now().toString(),
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

  const elapsedMinutes = Math.floor(
    (Date.now() - new Date(incomplete.sleepTime).getTime()) / 60000
  );

  if (elapsedMinutes < 10) {
    throw new Error("MINIMUM_DURATION");
  }

  const wakeTime = new Date().toISOString();
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

export async function updateEntry(updatedEntry: SleepEntry): Promise<void> {
  const entries = await getAllEntries();
  const index = entries.findIndex(e => e.id === updatedEntry.id);
  if (index !== -1) {
    entries[index] = updatedEntry;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
}