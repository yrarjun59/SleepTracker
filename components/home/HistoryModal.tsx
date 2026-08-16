// components/home/HistoryModal.tsx
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { SleepEntry } from "@/types/sleep";
import { getMonthlySummary } from "@/utils/analyticsHelpers";
import { useFormattedTime } from "@/utils/formatTime";
import { useMemo, useState } from "react";

import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Tab = "7d" | "15d" | "30d" | "6m";

interface Props {
  visible: boolean;
  onClose: () => void;
  entries: SleepEntry[];
}

const TABS: { key: Tab; label: string }[] = [
  { key: "7d", label: "7 Days" },
  { key: "15d", label: "15 Days" },
  { key: "30d", label: "30 Days" },
  { key: "6m", label: "6 Months" },
];

function getQualityVerdict(duration: number | null): string {
  if (duration === null) return "—";
  if (duration >= 7 && duration <= 9) return "Good";
  if (duration < 6) return "Low";
  if (duration > 9) return "Long";
  return "Fair";
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

export function HistoryModal({ visible, onClose, entries }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("7d");
  const { colors } = useTheme();
  const formatTime = useFormattedTime();
  const { showAlert } = useAlert();

  const { individualEntries, monthlySummary } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTab) {
      case "7d":
        end = now;
        start = daysAgo(7);
        break;
      case "15d":
        end = daysAgo(7);
        start = daysAgo(15);
        break;
      case "30d":
        end = daysAgo(15);
        start = daysAgo(30);
        break;
      case "6m":
        return {
          individualEntries: [],
          monthlySummary: getMonthlySummary(entries, 6),
        };
      default:
        return { individualEntries: [], monthlySummary: null };
    }

    const filtered = entries.filter((e) => {
      const d = new Date(e.sleepTime);
      return d >= start && d <= end;
    });

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.sleepTime).getTime() - new Date(a.sleepTime).getTime(),
    );

    return { individualEntries: sorted, monthlySummary: null };
  }, [entries, activeTab]);

  const formatEntry = (entry: SleepEntry) => {
    const sleep = new Date(entry.sleepTime);
    const wake = entry.wakeTime ? new Date(entry.wakeTime) : null;

    const sleepStr = `${sleep.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} ${formatTime(sleep)}`;

    const wakeStr = wake
      ? `${wake.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} ${formatTime(wake)}`
      : "—";

    return `${sleepStr}  –  ${wakeStr}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Sleep History
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.close, { color: colors.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key
                      ? { color: "#fff" }
                      : { color: colors.foreground },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "6m" ? (
            monthlySummary && monthlySummary.length > 0 ? (
              <FlatList
                data={monthlySummary}
                keyExtractor={(item) => item.month}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.monthRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.monthLabel, { color: colors.foreground }]}
                    >
                      {item.month}
                    </Text>
                    <View style={styles.monthStats}>
                      <Text
                        style={[styles.monthTotal, { color: colors.accent }]}
                      >
                        {item.totalHours.toFixed(1)} hrs
                      </Text>
                      <Text
                        style={[
                          styles.monthDetail,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Avg {item.avgHours.toFixed(1)} · {item.nights} night
                        {item.nights !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                No sleep data in the last 6 months.
              </Text>
            )
          ) : individualEntries.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              No entries in this period.
            </Text>
          ) : (
            <FlatList
              data={individualEntries}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View
                  style={[styles.item, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.leftBlock}>
                    <View style={styles.firstLine}>
                      <Text
                        style={[styles.itemText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {formatEntry(item)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.duration,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.duration ? `${item.duration.toFixed(1)} hrs` : "—"}
                    </Text>
                  </View>
                  <View style={styles.rightBlock}>
                    <Text
                      style={[
                        styles.qualityLabel,
                        { color: colors.textSecondary },
                        item.duration && item.duration >= 7
                          ? { color: colors.success }
                          : null,
                      ]}
                    >
                      {getQualityVerdict(item.duration)}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: "50%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  close: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabBar: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftBlock: {
    flex: 1,
  },
  firstLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  duration: {
    fontSize: 13,
    marginTop: 4,
  },
  rightBlock: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  qualityLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  monthStats: {
    alignItems: "flex-end",
  },
  monthTotal: {
    fontSize: 16,
    fontWeight: "700",
  },
  monthDetail: {
    fontSize: 12,
    marginTop: 2,
  },
});
