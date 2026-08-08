// app/(tabs)/analytics.tsx
import { RecentEntriesList } from "@/components/analytics/RecentEntriesList";
import { SleepBarChart } from "@/components/analytics/SleepBarChart";
import { StatsGrid } from "@/components/analytics/StatsGrid";
import { TimeFrameSelector } from "@/components/analytics/TimeFrameSelector";
import { HistoryModal } from "@/components/home/HistoryModal";
import { Colors } from "@/constants/Colors";
import { useSleepEntries } from "@/hooks/useSleepEntries";
import {
  DayData,
  getAllMonthsData,
  getDailyStats,
  getLast12MonthsData,
  getLast30DaysData,
  getLast7DaysData,
  getMonthlyStats,
  getScheduleConsistency,
} from "@/utils/analyticsHelpers";

import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { entries, refresh } = useSleepEntries();

  const [activePeriod, setActivePeriod] = useState<
    "Week" | "Month" | "Year" | "All"
  >("Week");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Refresh data when the tab gains focus
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/analytics") {
      refresh();
    }
  }, [pathname, refresh]);

  // ----------------------------------------------
  // 1. Chart data based on period
  // ----------------------------------------------
  const chartData: DayData[] = useMemo(() => {
    switch (activePeriod) {
      case "Week":
        return getLast7DaysData(entries);
      case "Month":
        return getLast30DaysData(entries);
      case "Year":
        return getLast12MonthsData(entries);
      case "All":
        return getAllMonthsData(entries);
      default:
        return [];
    }
  }, [entries, activePeriod]);

  // ----------------------------------------------
  // 2. Chart title & date range
  // ----------------------------------------------
  const chartTitle = useMemo(() => {
    switch (activePeriod) {
      case "Week":
        return "Last 7 days duration";
      case "Month":
        return "Last 30 days";
      case "Year":
        return "Last 12 months";
      case "All":
        return "All months";
    }
  }, [activePeriod]);

  const dateRangeText = useMemo(() => {
    if (chartData.length === 0) return "";
    const first = chartData[0].fullDate;
    const last = chartData[chartData.length - 1].fullDate;

    // For Year/All, fullDate is a month/year string
    if (activePeriod === "Year" || activePeriod === "All") {
      return `${first} - ${last}`;
    }

    // For Week/Month, fullDate is YYYY-MM-DD
    const format = (dateStr: string) => {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };
    return `${format(first)} - ${format(last)}`;
  }, [chartData, activePeriod]);

  // ----------------------------------------------
  // 3. Horizontal scrolling (for 12+ bars)
  // ----------------------------------------------
  const needsScroll = chartData.length >= 12; // changed to >= so year view scrolls
  const chartWidth = needsScroll ? chartData.length * 35 : undefined;

  // ----------------------------------------------
  // 4. Stats (dynamic: daily for Week/Month, monthly for Year/All)
  // ----------------------------------------------
  const isMonthlyView = activePeriod === "Year" || activePeriod === "All";

  const stats = useMemo(() => {
    if (isMonthlyView) {
      return getMonthlyStats(chartData);
    } else {
      return getDailyStats(chartData);
    }
  }, [chartData, isMonthlyView]);

  const scheduleConsistency = isMonthlyView
    ? undefined
    : getScheduleConsistency(entries);

  // ----------------------------------------------
  // 5. Render
  // ----------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Analytics</Text>

        <TimeFrameSelector active={activePeriod} onSelect={setActivePeriod} />

        {/* Bar chart card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{chartTitle}</Text>
            <View style={styles.dateRange}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={Colors.mutedForeground}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.dateRangeText}>{dateRangeText}</Text>
            </View>
          </View>

          {needsScroll ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 200 }}
            >
              <SleepBarChart
                data={chartData}
                width={chartWidth}
                idealHoursPerDay={8} // consistent goal
              />
            </ScrollView>
          ) : (
            <SleepBarChart
              data={chartData}
              idealHoursPerDay={8} // removed maxValue, use idealHoursPerDay
            />
          )}
        </View>

        {/* Stat cards */}
        <StatsGrid
          stats={stats}
          type={isMonthlyView ? "monthly" : "daily"}
          scheduleConsistency={scheduleConsistency}
        />

        {/* Recent entries list */}
        <RecentEntriesList
          entries={entries}
          onViewAll={() => setShowHistoryModal(true)}
        />
      </ScrollView>

      {/* History modal */}
      <HistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entries={entries}
      />
    </View>
  );
}

// styles unchanged...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.foreground,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.foreground,
  },
  dateRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateRangeText: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  weeklyWrapper: {
    marginBottom: 24,
  },
});
