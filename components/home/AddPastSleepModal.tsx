// components/home/AddPastSleepModal.tsx
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { pushEntry } from "@/services/cloudStorage";
import * as sleepStorage from "@/services/sleepStorage";
import { calculateDuration } from "@/utils/calculations";
import { toLocalISOString } from "@/utils/dateHelpers";

import { useTheme } from "@/contexts/ThemeContext";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFormattedTime } from "@/utils/formatTime";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddPastSleepModal({ visible, onClose, onSaved }: Props) {
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { timeFormat } = useSettings();
  const is24Hour = timeFormat === "24h";
  const formatTime = useFormattedTime();

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
  const [saving, setSaving] = useState(false);

  const adjustWakeAfterSleepChange = (newSleep: Date) => {
    const sleepHour = newSleep.getHours();
    let newWake = new Date(newSleep);

    if (sleepHour >= 20) {
      newWake.setDate(newWake.getDate() + 1);
      newWake.setHours(7, 0, 0, 0);
    } else {
      newWake.setHours(7, 0, 0, 0);
      if (newWake <= newSleep) {
        newWake = new Date(newSleep.getTime() + 60 * 60 * 1000);
      }
    }
    setWakeDate(newWake);
  };

  const formatPreview = (date: Date) =>
    `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} ${formatTime(date)}`;

  const openAndroidPicker = (
    currentDate: Date,
    onDateChosen: (date: Date) => void,
    minimumDate?: Date,
    is24Hour?: boolean,
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
            is24Hour: is24Hour,
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

  const dismissPicker = () => setIosPickerMode(null);

  const handleSave = async () => {
    dismissPicker();

    if (wakeDate <= sleepDate) {
      showAlert({
        type: "error",
        title: "Invalid time",
        message: "Wake time must be after sleep time.",
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
        title: "Too short",
        message: "Sleep must be at least 10 minutes.",
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
        {
          text: "Save",
          onPress: () => {
            saveWithDuplicateCheck();
          },
        },
      ],
    });
  };

  const saveWithDuplicateCheck = async () => {
    dismissPicker();
    setSaving(true);

    try {
      const newDate = toLocalISOString(sleepDate).split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];

      if (newDate !== todayStr) {
        const allEntries = await sleepStorage.getAllEntries();
        const duplicate = allEntries.find((entry) => entry.date === newDate);

        if (duplicate) {
          showAlert({
            type: "confirm",
            title: "Duplicate Date",
            message: `You already have a sleep record for ${newDate}. Replace it?`,
            actions: [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  console.log("Duplicate Cancel pressed – stopping loader");
                  setSaving(false);
                },
              },
              {
                text: "Replace",
                style: "destructive",
                onPress: async () => {
                  try {
                    await sleepStorage.deleteEntry(duplicate.id);
                    await saveNewEntry();
                  } catch (err) {
                    console.error("Replace failed:", err);
                    showAlert({
                      type: "error",
                      title: "Error",
                      message: "Could not replace entry.",
                      autoDismiss: true,
                    });
                  } finally {
                    setSaving(false);
                  }
                },
              },
            ],
          });
          return; // wait for user decision
        }
      }

      // No duplicate, save normally
      console.log("No duplicate, saving normally");
      await saveNewEntry();
    } catch (e) {
      console.error("saveWithDuplicateCheck error:", e);
      showAlert({
        type: "error",
        title: "Error",
        message: "Could not save the entry.",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNewEntry = async () => {
    console.log("saveNewEntry started");
    const duration = calculateDuration(
      toLocalISOString(sleepDate),
      toLocalISOString(wakeDate),
    );

    const entryData = {
      date: toLocalISOString(sleepDate).split("T")[0],
      sleepTime: toLocalISOString(sleepDate),
      wakeTime: toLocalISOString(wakeDate),
      duration,
      source: "manual" as const,
    };

    const newEntry = await sleepStorage.addManualEntry(entryData);
    console.log("Entry saved locally:", newEntry.id);

    if (user) {
      try {
        await pushEntry(user.uid, newEntry);
        console.log("Pushed to cloud");
      } catch (cloudError) {
        console.warn("Cloud push failed:", cloudError);
      }
    }

    onClose();
    onSaved();
    showAlert({
      type: "success",
      title: "Saved",
      message: "Sleep entry added.",
      autoDismiss: true,
    });
    console.log("saveNewEntry completed");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Add Past Sleep
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              All times are in your local timezone
            </Text>

            {/* Sleep picker */}
            <Text style={[styles.section, { color: colors.foreground }]}>
              When did you go to sleep?
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.muted }]}
              onPress={() => {
                if (Platform.OS === "android") {
                  openAndroidPicker(
                    sleepDate,
                    (date) => {
                      setSleepDate(date);
                      adjustWakeAfterSleepChange(date);
                    },
                    undefined,
                    is24Hour,
                  );
                } else {
                  setIosPickerMode("sleep");
                }
              }}
            >
              <Text
                style={[styles.dateButtonText, { color: colors.foreground }]}
              >
                {formatPreview(sleepDate)}
              </Text>
            </TouchableOpacity>

            {/* Wake picker */}
            <Text
              style={[
                styles.section,
                { color: colors.foreground, marginTop: 28 },
              ]}
            >
              When did you wake up?
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.muted }]}
              onPress={() => {
                if (Platform.OS === "android") {
                  openAndroidPicker(wakeDate, setWakeDate, undefined, is24Hour);
                } else {
                  setIosPickerMode("wake");
                }
              }}
            >
              <Text
                style={[styles.dateButtonText, { color: colors.foreground }]}
              >
                {formatPreview(wakeDate)}
              </Text>
            </TouchableOpacity>

            {/* Preview */}
            <View style={[styles.preview, { backgroundColor: colors.muted }]}>
              <Text
                style={[styles.previewLabel, { color: colors.mutedForeground }]}
              >
                Preview
              </Text>
              <Text style={[styles.previewText, { color: colors.foreground }]}>
                {formatPreview(sleepDate)}
              </Text>
              <Text style={[styles.arrow, { color: colors.primary }]}>↓</Text>
              <Text style={[styles.previewText, { color: colors.foreground }]}>
                {formatPreview(wakeDate)}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  dismissPicker();
                  onClose();
                }}
                disabled={saving}
              >
                <Text
                  style={[styles.cancelText, { color: colors.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: saving ? colors.muted : colors.primary },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* iOS picker */}
      {iosPickerMode && (
        <DateTimePicker
          value={iosPickerMode === "sleep" ? sleepDate : wakeDate}
          mode="datetime"
          display="spinner"
          is24Hour={is24Hour}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "92%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  dateButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  preview: {
    marginTop: 32,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewText: {
    fontSize: 16,
    fontWeight: "500",
  },
  arrow: {
    fontSize: 18,
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
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
