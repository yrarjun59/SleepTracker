import { useMemo } from "react";
import { SleepEntry } from "@/types/sleep";
import { getWeeklyAverage, getDifferenceInMinutes } from "@/utils/calculations";


export function useWeeklyStats(entries: SleepEntry[]) {
  return useMemo(() => {
    const thisWeek = getWeeklyAverage(entries, 0);
    const lastWeek = getWeeklyAverage(entries, -1);
    const differenceMinutes = getDifferenceInMinutes(thisWeek, lastWeek);

    return {
      thisWeek,
      lastWeek,
      differenceMinutes,
    };
  }, [entries]);
}