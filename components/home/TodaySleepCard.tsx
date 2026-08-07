import { Colors } from "@/constants/Colors";
import { getTodayQuote, SleepQuote } from "@/services/quoteService";
import { SleepEntry } from "@/types/sleep";
import { parseLocalDateTime } from "@/utils/dateHelpers";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

function getRelativeTimeLabel(lastWake: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastWake.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "18+ hrs";
  if (diffDays === 1) return "1 day";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 14) return "1 week";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 60) return "1 month";
  if (diffDays < 180) return `${Math.floor(diffDays / 30)} months`;
  return "6+ months";
}

function getShortRelativeTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface TodaySleepCardProps {
  sleepTime: string | null;
  wakeTime: string | null;
  duration: string | null;
  durationHours?: number;
  isSleeping?: boolean;
  elapsedLabel?: string;
  isEmpty?: boolean;
  napCount?: number;
  lastCompletedEntry?: SleepEntry | null;
}

export function TodaySleepCard({
  sleepTime,
  wakeTime,
  duration,
  durationHours,
  isSleeping = false,
  elapsedLabel,
  isEmpty = false,
  napCount = 1,
  lastCompletedEntry,
}: TodaySleepCardProps) {
  // const quote = SLEEP_QUOTES[new Date().getDate() % SLEEP_QUOTES.length];
  const quote: SleepQuote = getTodayQuote();

  // ----- derive awake duration from last completed entry -----
  let hoursAwake: number | null = null;

  if (lastCompletedEntry?.wakeTime) {
    const lastWake = parseLocalDateTime(lastCompletedEntry.wakeTime);
    hoursAwake = (Date.now() - lastWake.getTime()) / (1000 * 60 * 60);
  }

  // ----- labels (unchanged) -----
  const isNap =
    napCount === 1 && durationHours !== undefined && durationHours < 2;
  const topLabel = isSleeping
    ? "CURRENTLY SLEEPING"
    : napCount > 1
      ? "TODAY'S SLEEP"
      : isNap
        ? "TODAY'S NAP"
        : "TODAY'S SLEEP";

  // ----- always visible quote section -----
  const quoteSection = (
    <View style={styles.quoteBlock}>
      <Text style={styles.quoteText}>“{quote.text}”</Text>
      <Text style={styles.quoteAuthor}>— {quote.author}</Text>
    </View>
  );

  const renderBelow = () => {
    if (isSleeping) {
      return (
        <View style={styles.sleepingContainer}>
          <Text style={styles.sleepingSince}>Sleeping since {sleepTime}</Text>
          <Text style={styles.elapsed}>{elapsedLabel ?? "0m"}</Text>
        </View>
      );
    }

    if (lastCompletedEntry && hoursAwake != null) {
      const lastSleep = parseLocalDateTime(lastCompletedEntry.sleepTime);
      const lastWake = parseLocalDateTime(lastCompletedEntry.wakeTime!);

      const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " +
        d.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

      const detailsLine = (
        <Text style={styles.lastSleepDetail}>
          {fmt(lastSleep)} – {fmt(lastWake)}
        </Text>
      );

      if (hoursAwake < 18) {
        return (
          <View style={styles.recentSleep}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>☀️</Text>
            <Text style={styles.recentSleepText}>
              wake since {getShortRelativeTime(hoursAwake)}
            </Text>
            {detailsLine}
          </View>
        );
      } else {
        return (
          <View style={styles.reminder}>
            <Ionicons
              name="bed-outline"
              size={14}
              color={Colors.accent}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.reminderText, { color: Colors.accent }]}>
              last record{" "}
              {getRelativeTimeLabel(new Date(lastCompletedEntry.wakeTime!))} ago
              – time for some rest?
            </Text>
          </View>
        );
      }
    }

    return null;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{topLabel}</Text>
      {quoteSection}
      {renderBelow()}
    </View>
  );
}

// ================= Styles =================
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
  napBadge: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "600",
    marginTop: 2,
    position: "absolute",
    top: "100%",
    left: 0,
  },
  recentSleep: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recentSleepText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  reminder: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reminderText: {
    fontSize: 13,
    color: Colors.warning,
    flex: 1,
  },
  quoteContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  lastSleepDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  quoteBlock: {
    alignItems: "center",
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    color: Colors.foreground,
    textAlign: "center",
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
});
