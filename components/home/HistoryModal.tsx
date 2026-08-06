import { Colors } from "@/constants/Colors";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
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
  onEdit: (entry: SleepEntry) => void;
  onEntryUpdated: () => void;
  showActions?: boolean; // NEW – defaults to true
}

const TABS: { key: Tab; label: string }[] = [
  { key: "7d", label: "7 Days" },
  { key: "15d", label: "15 Days" },
  { key: "30d", label: "30 Days" },
  { key: "6m", label: "6 Months" },
];

export function HistoryModal({
  visible,
  onClose,
  entries,
  onEdit,
  onEntryUpdated,
  showActions = true, // default
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("7d");

  const now = new Date();
  const filtered = entries.filter((entry) => {
    const entryDate = new Date(entry.sleepTime);
    const diffMs = now.getTime() - entryDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (activeTab) {
      case "7d":
        return diffDays <= 7;
      case "15d":
        return diffDays <= 15;
      case "30d":
        return diffDays <= 30;
      case "6m":
        return diffDays <= 180;
    }
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.sleepTime).getTime() - new Date(a.sleepTime).getTime(),
  );

  

  const handleDelete = (entry: SleepEntry) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this sleep record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await sleepStorage.deleteEntry(entry.id);
            onEntryUpdated();
          },
        },
      ],
    );
  };

  const formatEntry = (entry: SleepEntry) => {
    const sleep = new Date(entry.sleepTime);
    const wake = entry.wakeTime ? new Date(entry.wakeTime) : null;

    const sleepStr = sleep.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const wakeStr = wake
      ? wake.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "—";

    return `${sleepStr}  –  ${wakeStr}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Sleep History</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {sorted.length === 0 ? (
            <Text style={styles.empty}>No entries in this period.</Text>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemText}>{formatEntry(item)}</Text>
                    <Text style={styles.duration}>
                      {item.duration ? `${item.duration.toFixed(1)} hrs` : ""}
                    </Text>
                  </View>
                  {showActions && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => onEdit(item)}
                        hitSlop={8}
                        style={styles.iconBtn}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        hitSlop={8}
                        style={styles.iconBtn}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#CC3333"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
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
    backgroundColor: Colors.card,
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
    color: Colors.foreground,
  },
  close: {
    fontSize: 16,
    color: Colors.primary,
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
    backgroundColor: Colors.muted,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.foreground,
  },
  tabTextActive: {
    color: "#fff",
  },
  empty: {
    textAlign: "center",
    color: Colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemText: {
    fontSize: 15,
    color: Colors.foreground,
    fontWeight: "500",
    flex: 1,
  },
  duration: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginLeft: 12,
    alignItems: "center",
  },
  iconBtn: {
    padding: 4,
  },
});
