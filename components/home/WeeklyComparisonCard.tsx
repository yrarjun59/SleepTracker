import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface WeeklyComparisonCardProps {
  thisWeek: number | null;
  lastWeek: number | null;
  differenceMinutes: number | null;
}

function formatDifference(minutes: number): string {
  const abs = Math.abs(minutes);
  if (abs >= 60) {
    const hrs = Math.floor(abs / 60);
    const mins = abs % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }
  return `${abs} min`;
}

export function WeeklyComparisonCard({
  thisWeek,
  lastWeek,
  differenceMinutes,
}: WeeklyComparisonCardProps) {
  const hasBothWeeks =
    thisWeek !== null && lastWeek !== null && differenceMinutes !== null;
  const isBetter = hasBothWeeks ? differenceMinutes >= 0 : false;

  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.muted }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        THIS WEEK VS LAST WEEK
      </Text>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            This week:
          </Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {thisWeek !== null ? `${thisWeek.toFixed(1)} hrs` : "— hrs"}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Last week:
          </Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {lastWeek !== null ? `${lastWeek.toFixed(1)} hrs` : "— hrs"}
          </Text>
        </View>
      </View>

      {hasBothWeeks ? (
        <View
          style={[styles.badge, isBetter ? styles.badgeGood : styles.badgeBad]}
        >
          <Ionicons
            name={isBetter ? "arrow-up" : "arrow-down"}
            size={16}
            color={isBetter ? colors.accent : colors.destructive}
          />
          <Text
            style={[
              styles.badgeText,
              { color: isBetter ? colors.accent : colors.destructive },
            ]}
          >
            {isBetter ? "+" : "−"}
            {formatDifference(differenceMinutes)}{" "}
            {isBetter ? "better" : "worse"}
          </Text>
        </View>
      ) : (
        <View style={[styles.badgeNeutral, { backgroundColor: colors.muted }]}>
          <Text
            style={[styles.badgeNeutralText, { color: colors.mutedForeground }]}
          >
            Not enough data to compare
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeNeutral: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeNeutralText: {
    fontSize: 14,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  stats: {
    gap: 10,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    width: 96,
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeGood: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  badgeBad: {
    backgroundColor: "rgba(239, 83, 80, 0.1)",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
