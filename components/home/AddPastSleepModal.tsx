import { Colors } from "@/constants/Colors";
import * as sleepStorage from "@/services/sleepStorage";
import { calculateDuration } from "@/utils/calculations";
import { toLocalISOString } from "@/utils/dateHelpers";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useAlert } from "@/contexts/AlertContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddPastSleepModal({ visible, onClose, onSaved }: Props) {
  const [sleepDate, setSleepDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(23, 0, 0, 0);
    return d;
  });

  const [wakeDate, setWakeDate] = useState(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });

  const [iosPickerMode, setIosPickerMode] = useState<"sleep" | "wake" | null>(
    null,
  );

  const { showAlert } = useAlert();

  const adjustWakeAfterSleepChange = (newSleep: Date) => {
    const sleepHour = newSleep.getHours();
    let newWake = new Date(newSleep);

    if (sleepHour >= 20) {
      // Late sleep → wake up next morning at 7 AM
      newWake.setDate(newWake.getDate() + 1);
      newWake.setHours(7, 0, 0, 0);
    } else {
      // Otherwise, set to same‑day 7 AM, but if that’s before sleep → sleep +1 hour
      newWake.setHours(7, 0, 0, 0);
      if (newWake <= newSleep) {
        newWake = new Date(newSleep.getTime() + 60 * 60 * 1000);
      }
    }

    setWakeDate(newWake);
  };

  const formatPreview = (date: Date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const openAndroidPicker = (
    currentDate: Date,
    onDateChosen: (date: Date) => void,
    minimumDate?: Date,
  ) => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: "date",
      is24Hour: false,
      maximumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === "dismissed") return;
        if (date) {
          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            is24Hour: false,
            minimumDate: minimumDate,
            maximumDate: new Date(),
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

  const handleIOSChange = (_event: any, selectedDate?: Date) => {
    if (!selectedDate) return;
    if (iosPickerMode === "sleep") {
      setSleepDate(selectedDate);
      adjustWakeAfterSleepChange(selectedDate);
    } else if (iosPickerMode === "wake") {
      setWakeDate(selectedDate);
    }
  };
  // --------- Save logic (unchanged) ----------
  const handleSave = async () => {
    if (wakeDate <= sleepDate) {
      showAlert({
        type: "success",
        title: "Saved",
        message: "Sleep entry added.",
        autoDismiss: true,
      });
      return;
    }

    const duration = calculateDuration(
      toLocalISOString(sleepDate),
      toLocalISOString(wakeDate),
    );

    if (duration < 0.16) {
      showAlert({
        type: "error",
        title: "Invalid time",
        message: "Wake time must be after sleep time.",
        autoDismiss: true,
      });
      return;
    }

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

    showAlert({
      type: "confirm",
      title: "Confirm Sleep Entry",
      message: `Sleep: ${sleepStr}\nWake: ${wakeStr}\nDuration: ${duration.toFixed(1)} hrs`,
      actions: [
        { text: "Cancel", style: "cancel", onPress: () => {} },
        { text: "Save", onPress: () => saveWithDuplicateCheck() },
      ],
    });
  };

  const saveWithDuplicateCheck = async () => {
    const newDate = toLocalISOString(sleepDate).split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    if (newDate !== todayStr) {
      try {
        const allEntries = await sleepStorage.getAllEntries();
        const duplicate = allEntries.find((entry) => entry.date === newDate);

        if (duplicate) {
          showAlert({
            type: "confirm",
            title: "Duplicate Date",
            message: `You already have a sleep record for ${newDate}. Replace it?`,
            actions: [
              { text: "Cancel", style: "cancel", onPress: () => {} },
              {
                text: "Replace",
                style: "destructive",
                onPress: async () => {
                  await sleepStorage.deleteEntry(duplicate.id);
                  await saveNewEntry();
                },
              },
            ],
          });
          return;
        }
      } catch (e) {
        showAlert({
          type: "error",
          title: "Something went wrong",
          message: "Couldn't check for duplicate entries. Save anyway?",
          actions: [
            { text: "Cancel", style: "cancel", onPress: () => {} },
            { text: "Save", onPress: () => saveNewEntry() },
          ],
        });
        return;
      }
    }

    await saveNewEntry();
  };

  const saveNewEntry = async () => {
    const duration = calculateDuration(
      toLocalISOString(sleepDate),
      toLocalISOString(wakeDate),
    );

    await sleepStorage.addManualEntry({
      date: toLocalISOString(sleepDate).split("T")[0],
      sleepTime: toLocalISOString(sleepDate),
      wakeTime: toLocalISOString(wakeDate),
      duration,
      source: "manual",
    });

    onSaved();
    onClose();
    showAlert({
      type: "success",
      title: "Saved",
      message: "Sleep entry added.",
      autoDismiss: true,
    });
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

            <Text style={styles.section}>When did you go to sleep?</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                if (Platform.OS === "android") {
                  openAndroidPicker(sleepDate, (date) => {
                    setSleepDate(date);
                    adjustWakeAfterSleepChange(date);
                  });
                } else {
                  setIosPickerMode("sleep");
                }
              }}
            >
              <Text style={styles.dateButtonText}>
                {formatPreview(sleepDate)}
              </Text>
            </TouchableOpacity>

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

      {iosPickerMode && (
        <DateTimePicker
          value={iosPickerMode === "sleep" ? sleepDate : wakeDate}
          mode="datetime"
          display="spinner"
          is24Hour={false}
          minimumDate={
            iosPickerMode === "wake"
              ? new Date(sleepDate.getTime() + 60 * 1000)
              : undefined
          }
          maximumDate={new Date()}
          onValueChange={handleIOSChange}
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
