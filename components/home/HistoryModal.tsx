import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { SleepEntry } from "@/types/sleep";
import { formatTime } from "@/utils/dateHelpers";

interface Props {
  visible: boolean;
  onClose: () => void;
  entries: SleepEntry[];
}

export function HistoryModal({ visible, onClose, entries }: Props) {
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

          {entries.length === 0 ? (
            <Text style={styles.empty}>No sleep records yet.</Text>
          ) : (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={styles.itemText}>{formatEntry(item)}</Text>
                  <Text style={styles.duration}>
                    {item.duration ? `${item.duration.toFixed(1)} hrs` : ""}
                  </Text>
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
    maxHeight: "75%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  empty: {
    textAlign: "center",
    color: Colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemText: {
    fontSize: 15,
    color: Colors.foreground,
    fontWeight: "500",
  },
  duration: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
});