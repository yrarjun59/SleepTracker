import { useAuth } from "@/contexts/AuthContext";
import { pullEntries, pushEntry } from "@/services/cloudStorage";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export function useSleepEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [incomplete, setIncomplete] = useState<SleepEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [all, inc] = await Promise.all([
        sleepStorage.getAllEntries(),
        sleepStorage.getIncompleteEntry(),
      ]);
      setEntries(all);
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

  // Sync on login: pull cloud data and merge
  useEffect(() => {
    if (user) {
      pullEntries(user.uid).then(async (cloudEntries) => {
        const localJson = await AsyncStorage.getItem("@sleep_entries");
        let localEntries: SleepEntry[] = localJson ? JSON.parse(localJson) : [];
        const localMap = new Map(localEntries.map((e) => [e.id, e]));
        for (const cloudEntry of cloudEntries) {
          if (!localMap.has(cloudEntry.id)) {
            localEntries.push(cloudEntry);
          }
        }
        await AsyncStorage.setItem(
          "@sleep_entries",
          JSON.stringify(localEntries),
        );
        refresh();
      });
    }
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
        if (user) pushEntry(user.uid, completed);
      }
    } catch (error: any) {
      if (error.message === "MINIMUM_DURATION") throw error;
      console.error(error);
    }
  };

  const addManualEntry = async (
    entry: Omit<SleepEntry, "id" | "createdAt">,
  ) => {
    const newEntry = await sleepStorage.addManualEntry(entry);
    setEntries((prev) => [newEntry, ...prev]);
    if (user) pushEntry(user.uid, newEntry);
    return newEntry;
  };

  const abortSleep = async () => {
    await sleepStorage.abortSleep();
    setIncomplete(null);
  };

  return {
    entries,
    incomplete,
    loading,
    refresh,
    startSleep,
    finishSleep,
    abortSleep,
    addManualEntry,
  };
}
