import { useTheme } from "@/contexts/ThemeContext";
import { DayData } from "@/utils/analyticsHelpers";
import { getSleepQuality, SLEEP_QUALITY_COLORS } from "@/utils/sleepQuality";
import { Dimensions, StyleSheet, Text, View } from "react-native";

interface SleepBarChartProps {
  data: DayData[];
  width?: number;
  maxValue?: number;
  idealHoursPerDay?: number;
}

// Card margins/padding are hardcoded to match the chart card style in analytics.tsx
const CARD_MARGIN_HORIZONTAL = 20; // from chartCard style
const CARD_PADDING = 20; // from chartCard style
const MAX_BAR_WIDTH = 45;
const GAP_BETWEEN_BARS = 10;

export function SleepBarChart({
  data,
  width,
  idealHoursPerDay = 8,
}: SleepBarChartProps) {
  const { colors } = useTheme();

  
  const screenWidth = Dimensions.get("window").width;
  const containerWidth =
    width ?? screenWidth - 2 * CARD_MARGIN_HORIZONTAL - 2 * CARD_PADDING;

  // Compute per‑bar width after subtracting gaps
  const gapCount = data.length - 1;
  const totalGaps = gapCount * GAP_BETWEEN_BARS;
  const availableWidth = containerWidth - totalGaps;
  const barWidth = data.length > 0 ? availableWidth / data.length : 0;
  const effectiveWidth = Math.min(barWidth, MAX_BAR_WIDTH);

  // Dynamic radius: 30% of bar width, clamped between 2 and 15
  const dynamicRadius = Math.max(2, Math.min(effectiveWidth * 0.4, 15));

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
            {/* Track with explicit width */}
            <View
              style={[
                styles.bar,
                {
                  width: effectiveWidth,
                  maxWidth: MAX_BAR_WIDTH,
                  backgroundColor: colors.muted,
                  borderTopLeftRadius: dynamicRadius,
                  borderTopRightRadius: dynamicRadius,
                },
              ]}
            >
              {/* Fill – same width and radius */}
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${percent}%`,
                    backgroundColor: barColor,
                    borderTopLeftRadius: dynamicRadius,
                    borderTopRightRadius: dynamicRadius,
                  },
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
    gap: GAP_BETWEEN_BARS,
  },
  barWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    height: "100%",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
  },
  barLabel: {
    marginTop: 6,
    textTransform: "uppercase",
  },
});
