import { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "@/constants/Colors";
import { calculateDuration } from "@/utils/calculations";
import * as sleepStorage from "@/services/sleepStorage";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddPastSleepModal({ visible, onClose, onSaved }: Props) {
  const now = new Date();

  // We keep real Date objects
  const [sleepDate, setSleepDate] = useState(now);
  const [wakeDate, setWakeDate] = useState(now);

  // For native pickers
  const [picker, setPicker] = useState<{
    target: "sleep" | "wake";
    mode: "date" | "time";
  } | null>(null);

  // ===== Helpers =====
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // ===== Save =====
  const handleSave = async () => {
    if (wakeDate.getTime() <= sleepDate.getTime()) {
      Alert.alert("Invalid time", "Wake time must be after sleep time.");
      return;
    }

    const duration = calculateDuration(
      sleepDate.toISOString(),
      wakeDate.toISOString()
    );

    if (duration < 0.16) {
      Alert.alert("Too short", "Sleep must be at least 10 minutes.");
      return;
    }

    try {
      await sleepStorage.addManualEntry({
        date: sleepDate.toISOString().split("T")[0],
        sleepTime: sleepDate.toISOString(),
        wakeTime: wakeDate.toISOString(),
        duration,
        source: "manual",
      });

      onSaved();
      onClose();
      Alert.alert("Saved", "Past sleep entry added.");
    } catch (e) {
      Alert.alert("Error", "Could not save the entry.");
    }
  };

  // ===== Change helpers =====
  const onPickerChange = (_: any, selected?: Date) => {
    if (selected && picker) {
      if (picker.target === "sleep") {
        setSleepDate(selected);
      } else {
        setWakeDate(selected);
      }
    }
    setPicker(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add Past Sleep</Text>
            <Text style={styles.subtitle}>Times use your local timezone</Text>

            {/* ====== SLEEP ====== */}
            <Text style={styles.sectionTitle}>Sleep time</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.box}
                onPress={() => setPicker({ target: "sleep", mode: "date" })}
              >
                <Text style={styles.boxLabel}>Date</Text>
                <Text style={styles.boxValue}>{formatDate(sleepDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.box}
                onPress={() => setPicker({ target: "sleep", mode: "time" })}
              >
                <Text style={styles.boxLabel}>Time</Text>
                <Text style={styles.boxValue}>{formatTime(sleepDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* ====== WAKE ====== */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Wake time</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.box}
                onPress={() => setPicker({ target: "wake", mode: "date" })}
              >
                <Text style={styles.boxLabel}>Date</Text>
                <Text style={styles.boxValue}>{formatDate(wakeDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.box}
                onPress={() => setPicker({ target: "wake", mode: "time" })}
              >
                <Text style={styles.boxLabel}>Time</Text>
                <Text style={styles.boxValue}>{formatTime(wakeDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewText}>
                {formatDate(sleepDate)}  {formatTime(sleepDate)}
              </Text>
              <Text style={styles.arrow}>↓</Text>
              <Text style={styles.previewText}>
                {formatDate(wakeDate)}  {formatTime(wakeDate)}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ====== PICKER ====== */}
          {picker && (
            <DateTimePicker
              value={picker.target === "sleep" ? sleepDate : wakeDate}
              mode={picker.mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onPickerChange}
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 4,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.foreground,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  box: {
    flex: 1,
    backgroundColor: Colors.muted,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  boxLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 6,
  },
  boxValue: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.foreground,
  },
  preview: {
    marginTop: 32,
    backgroundColor: Colors.muted,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.foreground,
  },
  arrow: {
    fontSize: 18,
    color: Colors.primary,
    marginVertical: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});