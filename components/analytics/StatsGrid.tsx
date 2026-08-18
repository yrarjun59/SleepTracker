// components/analytics/StatsGrid.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { DailyStats, MonthlyStats } from "@/utils/analyticsHelpers";
import { StyleSheet, Text, View } from "react-native";

interface StatsGridProps {
  stats: DailyStats | MonthlyStats;
  type: "daily" | "monthly";
  scheduleConsistency?: { consistentNights: number; totalNights: number };
}

export function StatsGrid({
  stats,
  type,
  scheduleConsistency,
}: StatsGridProps) {
  const { colors } = useTheme();
  const isDaily = type === "daily";

  const StatCard = ({
    label,
    value,
    unit,
  }: {
    label: string;
    value: string;
    unit: string;
  }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.cardValueRow}>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>
          {value}
        </Text>
        <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>
          {unit}
        </Text>
      </View>
    </View>
  );

  if (isDaily) {
    const daily = stats as DailyStats;
    return (
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            label="Avg Duration"
            value={daily.avgHours.toFixed(1)}
            unit="hrs"
          />
          <StatCard
            label="Best Night"
            value={daily.bestDay.hours.toFixed(1)}
            unit="hrs"
          />
        </View>
        <View style={styles.row}>
          <StatCard
            label="Worst Night"
            value={daily.worstDay.hours.toFixed(1)}
            unit="hrs"
          />
          {scheduleConsistency && (
            <StatCard
              label="Consistency"
              value={`${scheduleConsistency.consistentNights}/${scheduleConsistency.totalNights}`}
              unit="nights"
            />
          )}
        </View>
      </View>
    );
  }

  // Monthly view
  const monthly = stats as MonthlyStats;
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard
          label="Avg Monthly"
          value={monthly.avgHours.toFixed(1)}
          unit="hrs/night"
        />
        <StatCard
          label="Best Month"
          value={monthly.bestMonth.hours.toFixed(1)}
          unit="hrs"
        />
      </View>
      <View style={styles.row}>
        <StatCard
          label="Worst Month"
          value={monthly.worstMonth.hours.toFixed(1)}
          unit="hrs"
        />
        <StatCard
          label="Goal"
          value={`${monthly.targetPercent}%`}
          unit="of 7h/night"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  cardUnit: {
    fontSize: 13,
  },
});
