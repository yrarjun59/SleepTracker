import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

interface WeeklyComparisonCardProps {
  thisWeek: number;       // 6.4
  lastWeek: number;       // 6.1
  differenceMinutes: number; // +18 or -12
}

export function WeeklyComparisonCard({
  thisWeek,
  lastWeek,
  differenceMinutes,
}: WeeklyComparisonCardProps) {
  const isBetter = differenceMinutes >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>THIS WEEK VS LAST WEEK</Text>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>This week:</Text>
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {thisWeek.toFixed(1)} hrs
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last week:</Text>
          <Text style={styles.statValue}>{lastWeek.toFixed(1)} hrs</Text>
        </View>
      </View>

      <View style={[styles.badge, isBetter ? styles.badgeGood : styles.badgeBad]}>
        <Ionicons
          name={isBetter ? "arrow-up" : "arrow-down"}
          size={16}
          color={isBetter ? Colors.accent : Colors.destructive}
        />
        <Text
          style={[
            styles.badgeText,
            { color: isBetter ? Colors.accent : Colors.destructive },
          ]}
        >
          {isBetter ? "+" : ""}
          {Math.abs(differenceMinutes)} min {isBetter ? "better" : "worse"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.muted,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.mutedForeground,
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
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.foreground,
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