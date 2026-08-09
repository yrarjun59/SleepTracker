import { useTheme } from "@/contexts/ThemeContext";
import { DayData } from "@/utils/analyticsHelpers";
import { getSleepQuality, SLEEP_QUALITY_COLORS } from "@/utils/sleepQuality";
import { StyleSheet, Text, View } from "react-native";

interface SleepBarChartProps {
  data: DayData[];
  width?: number;
  maxValue?: number;
  idealHoursPerDay?: number;
}

export function SleepBarChart({
  data,
  width,
  idealHoursPerDay = 8,
}: SleepBarChartProps) {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.chartContainer, width ? { width } : {}]}>
      {data.map((day, index) => {
        const idealTotal = day.daysInPeriod * idealHoursPerDay;
        const percent = Math.min((day.totalHours / idealTotal) * 100, 100);
        const average = day.totalHours / day.daysInPeriod;
        const quality = getSleepQuality(average);
        const barColor = SLEEP_QUALITY_COLORS[quality];

        return (
          <View key={index} style={styles.barWrapper}>
            <View style={[styles.bar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.barFill,
                  { height: `${percent}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text
              style={[
                styles.barLabel,
                {
                  color: colors.textSecondary,
                  fontSize: data.length >= 12 ? 10 : 12,
                },
              ]}
            >
              {day.date}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 180,
    paddingTop: 8,
    gap: 6,
  },
  barWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  bar: {
    width: "90%",
    maxWidth: 45,
    height: "100%",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  barFill: {
    width: "100%",
  },
  barLabel: {
    marginTop: 6,
    textTransform: "uppercase",
  },
});
