// app/(tabs)/analytics.tsx
import { SleepBarChart } from "@/components/analytics/SleepBarChart";
import { SleepLineChart } from "@/components/analytics/SleepLineChart";
import { StatsGrid } from "@/components/analytics/StatsGrid";
import { TimeFrameSelector } from "@/components/analytics/TimeFrameSelector";
import { HistoryModal } from "@/components/home/HistoryModal";
import { useTheme } from "@/contexts/ThemeContext";
// import { useSleepEntries } from "@/hooks/old.useSleepEntries";
import { useSleepEntries } from "@/contexts/SleepEntriesContext";

import {
  DayData,
  getAllMonthsData,
  getDailySleepTimes,
  getDailyStats,
  getLast12MonthsData,
  getLast30DaysData,
  getLast7DaysData,
  getMonthlySleepTimes,
  getMonthlyStats,
  getScheduleConsistency,
  SleepTimePoint,
} from "@/utils/analyticsHelpers";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { entries, refresh } = useSleepEntries();
  const { colors } = useTheme();
  const [activePeriod, setActivePeriod] = useState<
    "Week" | "Month" | "Year" | "All"
  >("Week");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/analytics") refresh();
  }, [pathname, refresh]);

  // 1. Chart data (bar chart)
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

  // 2. Sleep time line chart data
  const sleepTimeData: SleepTimePoint[] = useMemo(() => {
    switch (activePeriod) {
      case "Week":
        return getDailySleepTimes(entries, 7);
      case "Month":
        return getDailySleepTimes(entries, 30);
      case "Year":
        return getMonthlySleepTimes(entries, 12);
      case "All":
        // All months from first entry to now (capped 24 months)
        const months = getAllMonthsData(entries);
        return getMonthlySleepTimes(entries, months.length);
      default:
        return [];
    }
  }, [entries, activePeriod]);

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
    if (activePeriod === "Year" || activePeriod === "All") {
      return `${first} - ${last}`;
    }
    const format = (dateStr: string) =>
      new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    return `${format(first)} - ${format(last)}`;
  }, [chartData, activePeriod]);

  const needsScroll = chartData.length >= 12;
  const chartWidth = needsScroll ? chartData.length * 35 : undefined;

  const isMonthlyView = activePeriod === "Year" || activePeriod === "All";
  const stats = useMemo(() => {
    if (isMonthlyView) return getMonthlyStats(chartData);
    return getDailyStats(chartData);
  }, [chartData, isMonthlyView]);
  const scheduleConsistency = isMonthlyView
    ? undefined
    : getScheduleConsistency(entries);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Analytics
        </Text>

        <TimeFrameSelector active={activePeriod} onSelect={setActivePeriod} />

        {/* Bar chart card */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.card,
              borderColor: "rgba(255,255,255,0.05)",
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              {chartTitle}
            </Text>
            <View style={styles.dateRange}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.mutedForeground}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.dateRangeText,
                  { color: colors.mutedForeground },
                ]}
              >
                {dateRangeText}
              </Text>
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
                idealHoursPerDay={8}
              />
            </ScrollView>
          ) : (
            <SleepBarChart data={chartData} idealHoursPerDay={8} />
          )}
        </View>

        {/* Line chart for sleep times */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.card,
              borderColor: "rgba(255,255,255,0.05)",
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>
            Sleep Times
          </Text>
          {needsScroll ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SleepLineChart data={sleepTimeData} width={chartWidth} />
            </ScrollView>
          ) : (
            <SleepLineChart data={sleepTimeData} />
          )}
        </View>

        {/* Stats grid moved to bottom */}
        <StatsGrid
          stats={stats}
          type={isMonthlyView ? "monthly" : "daily"}
          scheduleConsistency={scheduleConsistency}
        />
      </ScrollView>

      <HistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entries={entries}
      />
    </View>
  );
}

// styles unchanged except adding marginBottom to StatsGrid already via component
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  chartCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
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
  chartTitle: { fontSize: 15, fontWeight: "600" },
  dateRange: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateRangeText: { fontSize: 12 },
});
