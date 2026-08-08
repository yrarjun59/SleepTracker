// components/analytics/StatsGrid.tsx
import { Colors } from "@/constants/Colors";
import { DailyStats, MonthlyStats } from "@/utils/analyticsHelpers";
import { StyleSheet, Text, View } from "react-native";

interface StatsGridProps {
  stats: DailyStats | MonthlyStats;
  type: "daily" | "monthly";
  scheduleConsistency?: { consistentNights: number; totalNights: number }; // only for daily
}

export function StatsGrid({
  stats,
  type,
  scheduleConsistency,
}: StatsGridProps) {
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
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.cardValueRow}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardUnit}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard
          label={isDaily ? "Avg Duration" : "Avg Monthly"}
          value={(stats as any).avgHours.toFixed(1)}
          unit="hrs"
        />
        <StatCard
          label={isDaily ? "Best Night" : "Best Month"}
          value={
            isDaily
              ? (stats as DailyStats).bestDay.hours.toFixed(1)
              : (stats as MonthlyStats).bestMonth.hours.toFixed(1)
          }
          unit="hrs"
        />
      </View>
      <View style={styles.row}>
        <StatCard
          label={isDaily ? "Worst Night" : "Worst Month"}
          value={
            isDaily
              ? (stats as DailyStats).worstDay.hours.toFixed(1)
              : (stats as MonthlyStats).worstMonth.hours.toFixed(1)
          }
          unit="hrs"
        />
        {isDaily && scheduleConsistency ? (
          <StatCard
            label="Consistency"
            value={`${scheduleConsistency.consistentNights}/${scheduleConsistency.totalNights}`}
            unit="nights"
          />
        ) : (
          <StatCard
            label="Months"
            value={`${(stats as MonthlyStats).monthsTracked}`}
            unit="tracked"
          />
        )}
      </View>
    </View>
  );
}

// styles unchanged...

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
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.mutedForeground,
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
    color: Colors.foreground,
  },
  cardUnit: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
