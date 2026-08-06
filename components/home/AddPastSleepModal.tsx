import { Colors } from "@/constants/Colors";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import { calculateDuration } from "@/utils/calculations";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  entryToEdit?: SleepEntry;
}

export function AddPastSleepModal({
  visible,
  onClose,
  onSaved,
  entryToEdit,
}: Props) {
  const [sleepDate, setSleepDate] = useState(() => {
    if (entryToEdit) return new Date(entryToEdit.sleepTime);
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(23, 0, 0, 0);
    return d;
  });

  const [wakeDate, setWakeDate] = useState(() => {
    if (entryToEdit?.wakeTime) return new Date(entryToEdit.wakeTime);
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });

  const [iosPickerMode, setIosPickerMode] = useState<"sleep" | "wake" | null>(
    null,
  );

  const formatPreview = (date: Date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // Android picker chain (date → time) with maximumDate
  const openAndroidPicker = (
    currentDate: Date,
    onDateChosen: (date: Date) => void,
  ) => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: "date",
      is24Hour: false, // shows AM/PM
      maximumDate: new Date(), // ← block future dates
      onChange: (event, date) => {
        if (event.type === "dismissed") return;
        if (date) {
          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            is24Hour: false,
            maximumDate: new Date(), // ← also block future times
            onChange: (timeEvent, timeDate) => {
              if (timeEvent.type === "dismissed") return;
              if (timeDate) {
                onDateChosen(timeDate);
              }
            },
          });
        }
      },
    });
  };

  const handleSave = async () => {
    if (wakeDate <= sleepDate) {
      Alert.alert("Invalid time", "Wake time must be after sleep time.");
      return;
    }

    const duration = calculateDuration(
      sleepDate.toISOString(),
      wakeDate.toISOString(),
    );

    if (duration < 0.16) {
      Alert.alert("Too short", "Sleep must be at least 10 minutes.");
      return;
    }

    // Future dates are now blocked by the picker's maximumDate prop – no manual check needed.

    // Confirmation dialog before saving
    const sleepStr = sleepDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const wakeStr = wakeDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    Alert.alert(
      "Confirm Sleep Entry",
      `Sleep: ${sleepStr}\nWake:  ${wakeStr}\nDuration: ${duration.toFixed(1)} hrs`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: () => saveWithDuplicateCheck(),
        },
      ],
    );
  };

  const saveWithDuplicateCheck = async () => {
    const newDate = sleepDate.toISOString().split("T")[0];

    try {
      const allEntries = await sleepStorage.getAllEntries();
      const duplicate = allEntries.find(
        (entry) => entry.date === newDate && entry.id !== entryToEdit?.id,
      );

      if (duplicate) {
        Alert.alert(
          "Duplicate Date",
          `You already have a sleep record for ${newDate}. Would you like to replace it?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Replace",
              style: "destructive",
              onPress: async () => {
                await sleepStorage.deleteEntry(duplicate.id);
                await saveNewEntry();
              },
            },
          ],
        );
        return;
      }

      await saveNewEntry();
    } catch (e) {
      Alert.alert("Error", "Could not save the entry.");
    }
  };

  const saveNewEntry = async () => {
    const duration = calculateDuration(
      sleepDate.toISOString(),
      wakeDate.toISOString(),
    );

    const entryData = {
      ...(entryToEdit ? { id: entryToEdit.id } : {}),
      date: sleepDate.toISOString().split("T")[0],
      sleepTime: sleepDate.toISOString(),
      wakeTime: wakeDate.toISOString(),
      duration,
      source: "manual" as const,
    };

    if (entryToEdit) {
      await sleepStorage.updateEntry(entryData as SleepEntry);
    } else {
      await sleepStorage.addManualEntry(entryData);
    }

    onSaved();
    onClose();
    Alert.alert(entryToEdit ? "Updated" : "Saved", "Sleep entry saved.");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add Past Sleep</Text>
            <Text style={styles.subtitle}>
              All times are in your local timezone
            </Text>

            {/* Sleep */}
            <Text style={styles.section}>When did you go to sleep?</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                if (Platform.OS === "android") {
                  openAndroidPicker(sleepDate, setSleepDate);
                } else {
                  setIosPickerMode("sleep");
                }
              }}
            >
              <Text style={styles.dateButtonText}>
                {formatPreview(sleepDate)}
              </Text>
            </TouchableOpacity>

            {/* Wake */}
            <Text style={[styles.section, { marginTop: 28 }]}>
              When did you wake up?
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                if (Platform.OS === "android") {
                  openAndroidPicker(wakeDate, setWakeDate);
                } else {
                  setIosPickerMode("wake");
                }
              }}
            >
              <Text style={styles.dateButtonText}>
                {formatPreview(wakeDate)}
              </Text>
            </TouchableOpacity>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewText}>{formatPreview(sleepDate)}</Text>
              <Text style={styles.arrow}>↓</Text>
              <Text style={styles.previewText}>{formatPreview(wakeDate)}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* iOS native picker */}
      {iosPickerMode && (
        <DateTimePicker
          value={iosPickerMode === "sleep" ? sleepDate : wakeDate}
          mode="datetime"
          display="spinner"
          is24Hour={false}
          maximumDate={new Date()} // ← block future dates
          onValueChange={(event, date) => {
            if (date) {
              if (iosPickerMode === "sleep") setSleepDate(date);
              else setWakeDate(date);
            }
          }}
          onDismiss={() => setIosPickerMode(null)}
        />
      )}
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
    maxHeight: "92%",
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
    marginBottom: 24,
  },
  section: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.foreground,
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: Colors.muted,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "500",
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
