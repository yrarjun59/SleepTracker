import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

interface TodaySleepCardProps {
  sleepTime: string | null;
  wakeTime: string | null;
  duration: string | null;
  isSleeping?: boolean;
  elapsedLabel?: string; // e.g. "1h 23m"
}

export function TodaySleepCard({
  sleepTime,
  wakeTime,
  duration,
  isSleeping = false,
  elapsedLabel,
}: TodaySleepCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {isSleeping ? "CURRENTLY SLEEPING" : "TODAY'S SLEEP"}
      </Text>

      {isSleeping ? (
        // ===== Sleeping State =====
        <View style={styles.sleepingContainer}>
          <Text style={styles.sleepingSince}>
            Sleeping since {sleepTime}
          </Text>
          <Text style={styles.elapsed}>{elapsedLabel ?? "0m"}</Text>
        </View>
      ) : (
        // ===== Normal State =====
        <View style={styles.row}>
          <View style={styles.times}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Sleep:</Text>
              <Text style={styles.timeValue}>{sleepTime ?? "—"}</Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Wake:</Text>
              <Text style={styles.timeValue}>{wakeTime ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{duration ?? "—"}</Text>
            <Ionicons name="alarm" size={20} color={Colors.primary} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.mutedForeground,
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  times: {
    gap: 6,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeLabel: {
    width: 48,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.foreground,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  duration: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
  },
  // Sleeping styles
  sleepingContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sleepingSince: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  elapsed: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.primary,
  },
});