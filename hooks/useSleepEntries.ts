import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import { useCallback, useEffect, useState } from "react";

export function useSleepEntries() {
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
      }
    } catch (error: any) {
      if (error.message === "MINIMUM_DURATION") {
        throw error; 
      }
      console.error(error);
    }
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
  };
}
