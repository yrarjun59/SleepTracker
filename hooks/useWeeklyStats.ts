import { SleepEntry } from "@/types/sleep";
import { getDifferenceInMinutes, getWeeklyAverage } from "@/utils/calculations";
import { useMemo } from "react";

export function useWeeklyStats(entries: SleepEntry[]) {
  return useMemo(() => {
    const thisWeek = getWeeklyAverage(entries, 0);
    const lastWeek = getWeeklyAverage(entries, -1);

    const differenceMinutes =
      thisWeek !== null && lastWeek !== null
        ? getDifferenceInMinutes(thisWeek, lastWeek)
        : null;

    return {
      thisWeek, // number | null
      lastWeek, // number | null
      differenceMinutes, // number | null
    };
  }, [entries]);
}
