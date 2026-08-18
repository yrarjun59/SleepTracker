// components/home/TodaySleepCard.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { getTodayQuote, Quote } from "@/services/quoteService";
import { SleepEntry } from "@/types/sleep";
import { parseLocalDateTime } from "@/utils/dateHelpers";
import { useFormattedTime } from "@/utils/formatTime";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

function getRelativeTimeLabel(lastWake: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastWake.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

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
  const [quote, setQuote] = useState<Quote>({ text: "", author: "" });
  const { colors } = useTheme();
  const formatTime = useFormattedTime();

  useEffect(() => {
    const q = getTodayQuote();
    setQuote(q);
  }, []);

  let hoursAwake: number | null = null;
  if (lastCompletedEntry?.wakeTime) {
    const lastWake = parseLocalDateTime(lastCompletedEntry.wakeTime);
    const raw = (Date.now() - lastWake.getTime()) / (1000 * 60 * 60);
    hoursAwake = Math.max(0, raw); // never show negative
  }

  const isNap =
    napCount === 1 && durationHours !== undefined && durationHours < 2;
  const topLabel = isSleeping
    ? "CURRENTLY SLEEPING"
    : napCount > 1
      ? "TODAY'S SLEEP"
      : isNap
        ? "TODAY'S NAP"
        : "TODAY'S SLEEP";

  const quoteSection = (
    <View style={styles.quoteBlock}>
      <Text
        style={[styles.quoteText, { color: colors.foreground }]}
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        “{quote.text}”
      </Text>
      <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>
        — {quote.author}
      </Text>
    </View>
  );

  const renderBelow = () => {
    if (isSleeping) {
      return (
        <View style={styles.sleepingContainer}>
          <Text style={[styles.sleepingSince, { color: colors.textSecondary }]}>
            Sleeping since {sleepTime}
          </Text>
          <Text style={[styles.elapsed, { color: colors.primary }]}>
            {elapsedLabel ?? "0m"}
          </Text>
        </View>
      );
    }
    if (!isSleeping && !isEmpty && sleepTime && wakeTime && duration) {
      return (
        <View style={[styles.recentSleep, { borderTopColor: colors.border }]}>
          <Text
            style={[styles.lastSleepDetail, { color: colors.textSecondary }]}
          >
            Last sleep: {sleepTime} → {wakeTime} · {duration}
          </Text>
        </View>
      );
    }

    if (lastCompletedEntry && hoursAwake != null) {
      const lastSleep = parseLocalDateTime(lastCompletedEntry.sleepTime);
      const lastWake = parseLocalDateTime(lastCompletedEntry.wakeTime!);

      const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " +
        formatTime(d);

      if (hoursAwake < 18) {
        return (
          <View style={[styles.recentSleep, { borderTopColor: colors.border }]}>
            <View style={styles.wakeSinceRow}>
              <Text style={{ fontSize: 14, marginRight: 4 }}>☀️</Text>
              <Text
                style={[
                  styles.recentSleepText,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                wake since {getShortRelativeTime(hoursAwake)}
              </Text>
              <Text
                style={[
                  styles.lastSleepDetail,
                  { color: colors.textSecondary },
                ]}
              >
                {fmt(lastSleep)} – {fmt(lastWake)}
              </Text>
            </View>
          </View>
        );
      } else {
        return (
          <View style={[styles.reminder, { borderTopColor: colors.border }]}>
            <Ionicons
              name="bed-outline"
              size={14}
              color={colors.accent}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.reminderText, { color: colors.accent }]}>
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
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {topLabel}
        {!isSleeping && !isEmpty && sleepTime && wakeTime && duration && (
          <View style={styles.todaySummary}>
            <Ionicons
              name="bed-outline"
              size={14}
              color={colors.accent}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {sleepTime} → {wakeTime} · {duration}
            </Text>
          </View>
        )}
      </Text>
      {quoteSection}
      {renderBelow()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  sleepingContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sleepingSince: {
    fontSize: 16,
    marginBottom: 8,
  },
  elapsed: {
    fontSize: 36,
    fontWeight: "700",
  },
  recentSleep: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  recentSleepText: {
    fontSize: 12,
    flex: 1,
  },
  reminder: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  reminderText: {
    fontSize: 12,
    flex: 1,
  },
  quoteBlock: {
    alignItems: "center",
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 13,
    marginTop: 6,
  },
  wakeSinceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  lastSleepDetail: {
    fontSize: 12,
  },
  todaySummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
  },
});
