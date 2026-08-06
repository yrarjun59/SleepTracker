import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface TodaySleepCardProps {
  sleepTime: string | null;
  wakeTime: string | null;
  duration: string | null; // formatted string (e.g. "7.5 hrs")
  durationHours?: number; // raw hours for logic (e.g. 0.8)
  isSleeping?: boolean;
  elapsedLabel?: string;
  isEmpty?: boolean;
  napCount?: number; // how many separate sleeps today
}

const SLEEP_QUOTES = [
  "A good laugh and a long sleep are the best cures.",
  "Sleep is the best meditation.",
  "Your future depends on a good night’s sleep.",
  "Rest is not idleness.",
  "The best bridge between despair and hope is a good night’s sleep.",
];

export function TodaySleepCard({
  sleepTime,
  wakeTime,
  duration,
  durationHours,
  isSleeping = false,
  elapsedLabel,
  isEmpty = false,
  napCount = 1,
}: TodaySleepCardProps) {
  const quote = SLEEP_QUOTES[new Date().getDate() % SLEEP_QUOTES.length];

  // Decide label for single entries based on duration
  const isNap =
    napCount === 1 && durationHours !== undefined && durationHours < 2;
  const topLabel = isSleeping
    ? "CURRENTLY SLEEPING"
    : napCount > 1
      ? "TODAY'S SLEEP" // multiple chunks – keep generic
      : isNap
        ? "TODAY'S NAP"
        : "TODAY'S SLEEP";

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{topLabel}</Text>

      {isSleeping ? (
        <View style={styles.sleepingContainer}>
          <Text style={styles.sleepingSince}>Sleeping since {sleepTime}</Text>
          <Text style={styles.elapsed}>{elapsedLabel ?? "0m"}</Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="moon"
            size={28}
            color={Colors.primary}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.quote}>“{quote}”</Text>
          <Text style={styles.emptyHint}>
            Tap the button below to start tracking
          </Text>
        </View>
      ) : napCount > 1 ? (
        // Multiple naps – show total and count
        <View style={styles.multiNap}>
          <Text style={styles.totalDuration}>{duration ?? "—"}</Text>
          <Text style={styles.napSubtext}>{napCount} naps today</Text>
        </View>
      ) : (
        // Single sleep entry
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
            {isNap && <Text style={styles.napBadge}>Nap</Text>}
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
    position: "relative",
  },
  duration: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
  },
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  quote: {
    fontSize: 16,
    fontStyle: "italic",
    color: Colors.foreground,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 10,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  // Multiple naps styles
  multiNap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  totalDuration: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  napSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Single nap badge
  napBadge: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "600",
    marginTop: 2,
    position: "absolute",
    top: "100%",
    left: 0,
  },
});
