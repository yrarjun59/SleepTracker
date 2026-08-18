import { useAuth } from "@/contexts/AuthContext";
import {
  pullEntries,
  pushEntry
} from "@/services/cloudStorage";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import {
  dismissSleepingNotification,
  showSleepingNotification,
} from "@/utils/sleepNotification";
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

  // Sync on login: pull cloud data and merge
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          // 1. Pull cloud entries
          const cloudEntries = await pullEntries(user.uid);
          const localJson = await AsyncStorage.getItem("@sleep_entries");
          let localEntries: SleepEntry[] = localJson
            ? JSON.parse(localJson)
            : [];

          // 2. Merge cloud entries into local (only add missing IDs)
          const localMap = new Map(localEntries.map((e) => [e.id, e]));
          for (const cloudEntry of cloudEntries) {
            if (!localMap.has(cloudEntry.id)) {
              localMap.set(cloudEntry.id, cloudEntry);
            }
          }
          // 3. Collect all entries after merge
          const mergedEntries = Array.from(localMap.values());
          await AsyncStorage.setItem(
            "@sleep_entries",
            JSON.stringify(mergedEntries),
          );

          // 4. Push local entries that are not in cloud
          for (const entry of mergedEntries) {
            if (!cloudEntries.some((c) => c.id === entry.id)) {
              try {
                await pushEntry(user.uid, entry);
              } catch (pushErr) {
                console.warn("Failed to push offline entry:", pushErr);
              }
            }
          }

          refresh();
        } catch (error) {
          console.error("Sync failed:", error);
        }
      })();
    }
  }, [user, refresh]);
  const startSleep = async () => {
    const entry = await sleepStorage.startSleep();
    setIncomplete(entry);
    await showSleepingNotification();
  };

  const finishSleep = async () => {
    try {
      const completed = await sleepStorage.finishSleep();
      if (completed) {
        setIncomplete(null);
        setEntries((prev) => [completed, ...prev]);
        if (user) pushEntry(user.uid, completed);
        await dismissSleepingNotification();
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
    await dismissSleepingNotification();
  };

  //   const deleteEntry = async (id: string) => {
  //   await sleepStorage.deleteEntry(id);
  //   setEntries((prev) => prev.filter((e) => e.id !== id));
  //   if (user) deleteEntryFromCloud(user.uid, id);   // import this from cloudStorage
  // };

  return {
    entries,
    incomplete,
    loading,
    refresh,
    startSleep,
    finishSleep,
    abortSleep,
    addManualEntry,
    // deleteEntry
  };
}
