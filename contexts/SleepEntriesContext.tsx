// contexts/SleepEntriesContext.tsx
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteEntryFromCloud,
  pullEntries,
  pushEntry,
} from "@/services/cloudStorage";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SleepEntriesContextType {
  entries: SleepEntry[];
  incomplete: SleepEntry | null;
  loading: boolean;
  syncError: string | null;
  startSleep: () => Promise<void>;
  finishSleep: () => Promise<void>;
  abortSleep: () => Promise<void>;
  addManualEntry: (
    entry: Omit<SleepEntry, "id" | "createdAt">,
  ) => Promise<SleepEntry>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  lastSyncedAt: Date | null;
}

const SleepEntriesContext = createContext<SleepEntriesContextType | undefined>(
  undefined,
);

export function SleepEntriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [incomplete, setIncomplete] = useState<SleepEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [all, inc] = await Promise.all([
        sleepStorage.getAllEntries(),
        sleepStorage.getIncompleteEntry(),
      ]);

      // Deduplicate by ID just in case
      const uniqueEntries = Array.from(
        new Map(all.map((e) => [e.id, e])).values(),
      );
      setEntries(uniqueEntries);
      setIncomplete(inc);
    } catch (error) {
      console.error("Failed to load sleep data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sync on login
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // 1. Pull cloud entries
        const cloudEntries = await pullEntries(user.uid);
        const localJson = await AsyncStorage.getItem("@sleep_entries");
        let localEntries: SleepEntry[] = localJson ? JSON.parse(localJson) : [];

        // Merge by ID, prefer latest `createdAt`
        const localMap = new Map(localEntries.map((e) => [e.id, e]));

        for (const cloudEntry of cloudEntries) {
          const local = localMap.get(cloudEntry.id);
          if (!local) {
            localMap.set(cloudEntry.id, cloudEntry);
          } else if (
            cloudEntry.createdAt &&
            local.createdAt &&
            cloudEntry.createdAt > local.createdAt
          ) {
            localMap.set(cloudEntry.id, cloudEntry);
          }
        }

        const merged = Array.from(localMap.values());
        await AsyncStorage.setItem("@sleep_entries", JSON.stringify(merged));

        // 2. Push local entries not in cloud
        for (const entry of merged) {
          if (!cloudEntries.some((c) => c.id === entry.id)) {
            await pushEntry(user.uid, entry);
          }
        }

        // Set lastSyncedAt once after successful sync
        setLastSyncedAt(new Date());

        await refresh();
      } catch (error) {
        console.error("Cloud sync failed:", error);
        setSyncError("Cloud sync failed. Some data may not be backed up.");
      }
    })();
  }, [user, refresh]);

  const startSleep = async () => {
    const entry = await sleepStorage.startSleep();
    setIncomplete(entry);
  };

  const finishSleep = async () => {
    try {
      const completed = await sleepStorage.finishSleep();
      if (completed) {
        setIncomplete(null);
        setEntries((prev) => [completed, ...prev]);
        if (user) {
          try {
            await pushEntry(user.uid, completed);
            setLastSyncedAt(new Date()); // ← added
          } catch (err) {
            console.warn("Cloud push failed on finishSleep:", err);
            setSyncError("Cloud backup failed. Entry saved locally.");
          }
        }
      }
    } catch (error: any) {
      if (error.message === "MINIMUM_DURATION") throw error;
      console.error(error);
    }
  };

  const abortSleep = async () => {
    await sleepStorage.abortSleep();
    setIncomplete(null);
  };

  const addManualEntry = async (
    entry: Omit<SleepEntry, "id" | "createdAt">,
  ) => {
    const newEntry = await sleepStorage.addManualEntry(entry);
    setEntries((prev) => [newEntry, ...prev]);
    if (user) {
      try {
        await pushEntry(user.uid, newEntry);
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn("Cloud push failed on manual entry:", err);
        setSyncError("Cloud backup failed. Entry saved locally.");
      }
    }
    return newEntry;
  };

  const deleteEntry = async (id: string) => {
    await sleepStorage.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (user) {
      try {
        await deleteEntryFromCloud(user.uid, id);
        setLastSyncedAt(new Date()); // ← added
      } catch (err) {
        console.warn("Cloud delete failed:", err);
        setSyncError("Cloud delete failed. Local entry removed.");
      }
    }
  };

  return (
    <SleepEntriesContext.Provider
      value={{
        entries,
        incomplete,
        loading,
        syncError,
        lastSyncedAt,
        startSleep,
        finishSleep,
        abortSleep,
        addManualEntry,
        deleteEntry,
        refresh,
      }}
    >
      {children}
    </SleepEntriesContext.Provider>
  );
}

export function useSleepEntries() {
  const ctx = useContext(SleepEntriesContext);
  if (!ctx)
    throw new Error("useSleepEntries must be used within SleepEntriesProvider");
  return ctx;
}
