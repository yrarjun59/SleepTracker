import { Colors } from "@/constants/Colors";
import { SleepEntry } from "@/types/sleep";
import { formatTime } from "@/utils/dateHelpers";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RecentEntriesListProps {
  entries: SleepEntry[];
  onViewAll: () => void;
}

function getQualityVerdict(duration: number | null): string {
  if (duration === null) return "—";
  if (duration >= 7 && duration <= 9) return "Good";
  if (duration < 6) return "Low";
  if (duration > 9) return "Long";
  return "Fair";
}

export function RecentEntriesList({
  entries,
  onViewAll,
}: RecentEntriesListProps) {
  const recent = entries
    .filter((e) => e.wakeTime !== null)
    .sort(
      (a, b) =>
        new Date(b.wakeTime!).getTime() - new Date(a.wakeTime!).getTime(),
    )
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.6}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {recent.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No sleep records yet.</Text>
        </View>
      ) : (
        recent.map((item) => {
          const sleepDate = new Date(item.sleepTime);
          const wakeDate = item.wakeTime ? new Date(item.wakeTime) : null;
          const dateFormatted = sleepDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const wakeTimeFormatted = wakeDate ? formatTime(item.wakeTime) : "—";
          const durationFormatted = item.duration
            ? `${item.duration.toFixed(1)} hrs`
            : "—";
          const quality = getQualityVerdict(item.duration);

          return (
            <View key={item.id} style={styles.entryCard}>
              <View style={styles.left}>
                <Text style={styles.entryDate}>{dateFormatted}</Text>
                <Text style={styles.entryWakeTime}>
                  {wakeTimeFormatted} Wakeup
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.entryDuration}>{durationFormatted}</Text>
                <Text
                  style={[
                    styles.quality,
                    quality === "Good" && styles.qualityGood,
                  ]}
                >
                  {quality}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.foreground,
  },
  viewAll: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  left: {
    flex: 1,
  },
  entryDate: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.foreground,
    marginBottom: 2,
  },
  entryWakeTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  right: {
    alignItems: "flex-end",
  },
  entryDuration: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.accent,
    marginBottom: 2,
  },
  quality: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  qualityGood: {
    color: Colors.success,
  },
});
