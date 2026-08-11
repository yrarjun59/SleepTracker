// components/profile/NotificationSettingsModal.tsx
import { useAlert } from "@/contexts/AlertContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFormattedTime } from "@/utils/formatTime";
import { useEffect, useRef, useState } from "react";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const [now, setNow] = useState(new Date());
  const { colors, mode } = useTheme();
  const { timeFormat } = useSettings();
  const { prefs, updatePrefs } = useNotifications();
  const { showAlert } = useAlert();
  const formatTime = useFormattedTime();
  const isPickerOpen = useRef(false); // single declaration

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  const initialBedtime = new Date();
  const [bedHour, bedMin] = prefs.bedtime.split(":").map(Number);
  initialBedtime.setHours(bedHour, bedMin, 0, 0);

  const initialWakeup = new Date();
  const [wakeHour, wakeMin] = prefs.wakeupTime.split(":").map(Number);
  initialWakeup.setHours(wakeHour, wakeMin, 0, 0);

  const [bedtimeDate, setBedtimeDate] = useState(initialBedtime);
  const [wakeupDate, setWakeupDate] = useState(initialWakeup);
  const [pickerTarget, setPickerTarget] = useState<"bedtime" | "wakeup" | null>(
    null,
  );

  // Live clock for remaining time
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getRemainingTime = (targetDate: Date) => {
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Already passed – reminding tomorrow";
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Reminder in ${diffH}h ${diffM}m`;
  };

  // Save and show confirmation
  const saveTimes = async () => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const bedtime = `${pad(bedtimeDate.getHours())}:${pad(bedtimeDate.getMinutes())}`;
    const wakeup = `${pad(wakeupDate.getHours())}:${pad(wakeupDate.getMinutes())}`;
    await updatePrefs({ bedtime, wakeupTime: wakeup });

    // Determine which reminder is closest
    const nowMs = Date.now();
    const bedMs = bedtimeDate.getTime();
    const wakeMs = wakeupDate.getTime();

    let nextLabel = "";
    if (bedMs <= nowMs && wakeMs <= nowMs) {
      nextLabel = "Next reminders start tomorrow";
    } else {
      const nextDate =
        bedMs > nowMs && (bedMs < wakeMs || wakeMs <= nowMs)
          ? bedtimeDate
          : wakeupDate;

      const remaining = getRemainingTime(nextDate);
      const isBedtime = nextDate === bedtimeDate;
      nextLabel = `${isBedtime ? "Bedtime" : "Wake‑up"} ${remaining.replace("Reminder in ", "")}`;
    }

    showAlert({
      type: "success",
      title: "Reminders saved",
      message: nextLabel,
      autoDismiss: true,
    });

    setHasChanges(false);
    onClose();
  };

  const markChanged = (fn?: () => void) => {
    setHasChanges(true);
    fn?.();
  };

  const is24Hour = timeFormat === "24h";

  // ---- Android picker effect ----
  useEffect(() => {
    if (pickerTarget === null || Platform.OS !== "android") return;
    if (isPickerOpen.current) return; // already open

    isPickerOpen.current = true;
    const currentDate = pickerTarget === "bedtime" ? bedtimeDate : wakeupDate;

    DateTimePickerAndroid.open({
      value: currentDate,
      mode: "time",
      is24Hour,
      onChange: (event, date) => {
        isPickerOpen.current = false;
        if (event.type === "set" && date) {
          markChanged();
          if (pickerTarget === "bedtime") setBedtimeDate(date);
          else if (pickerTarget === "wakeup") setWakeupDate(date);
        }
        setPickerTarget(null);
      },
    });
  }, [pickerTarget]); // depends only on pickerTarget

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={() => {}}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Notification Settings
            </Text>

            {/* ---- REMINDERS ---- */}
            <Text
              style={[styles.sectionHeader, { color: colors.mutedForeground }]}
            >
              REMINDERS
            </Text>
            <View style={[styles.card, { backgroundColor: colors.muted }]}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Bedtime reminder
                  </Text>
                  <Text
                    style={[styles.sublabel, { color: colors.textSecondary }]}
                  >
                    {formatTime(bedtimeDate)} daily
                  </Text>
                </View>
                <Switch
                  value={prefs.setupComplete}
                  onValueChange={(value) =>
                    markChanged(() => updatePrefs({ setupComplete: value }))
                  }
                  trackColor={{ false: colors.muted, true: colors.accent }}
                />
              </View>

              <TouchableOpacity
                style={[styles.timeButton, { borderColor: colors.border }]}
                onPress={() => setPickerTarget("bedtime")}
              >
                <Text
                  style={[styles.timeButtonText, { color: colors.foreground }]}
                >
                  {formatTime(bedtimeDate)}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.remainingText,
                  { color: colors.mutedForeground },
                ]}
              >
                {getRemainingTime(bedtimeDate)}
              </Text>

              <TouchableOpacity
                style={[styles.timeButton, { borderColor: colors.border }]}
                onPress={() => setPickerTarget("wakeup")}
              >
                <Text
                  style={[styles.timeButtonText, { color: colors.foreground }]}
                >
                  {formatTime(wakeupDate)}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.remainingText,
                  { color: colors.mutedForeground },
                ]}
              >
                {getRemainingTime(wakeupDate)}
              </Text>
            </View>

            {/* ---- QUOTES ---- */}
            <Text
              style={[styles.sectionHeader, { color: colors.mutedForeground }]}
            >
              INSPIRATION
            </Text>
            <View style={[styles.card, { backgroundColor: colors.muted }]}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Daily sleep quotes
                  </Text>
                  <Text
                    style={[styles.sublabel, { color: colors.textSecondary }]}
                  >
                    Receive 5 inspiring quotes throughout the day
                  </Text>
                </View>
                <Switch
                  value={prefs.quoteNotifications}
                  onValueChange={(value) =>
                    markChanged(() =>
                      updatePrefs({ quoteNotifications: value }),
                    )
                  }
                  trackColor={{ false: colors.muted, true: colors.accent }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.doneButton,
                { backgroundColor: hasChanges ? colors.accent : colors.muted },
              ]}
              onPress={saveTimes}
              disabled={!hasChanges}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.doneText,
                  { color: hasChanges ? "#fff" : colors.textSecondary },
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>

      {/* iOS picker */}
      {pickerTarget !== null && Platform.OS === "ios" && (
        <DateTimePicker
          value={pickerTarget === "bedtime" ? bedtimeDate : wakeupDate}
          mode="time"
          display="spinner"
          is24Hour={is24Hour}
          onChange={(event, date) => {
            if (date) {
              markChanged();
              if (pickerTarget === "bedtime") setBedtimeDate(date);
              else if (pickerTarget === "wakeup") setWakeupDate(date);
            }
            setPickerTarget(null);
          }}
        />
      )}

      {/* Android picker is handled by the useEffect above – nothing to render here */}
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 4,
  },
  rowLeft: { flex: 1, marginRight: 16 },
  label: { fontSize: 15, fontWeight: "500" },
  sublabel: { fontSize: 12, marginTop: 2 },
  timeButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  timeButtonText: { fontSize: 16 },
  doneButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  doneText: { fontWeight: "600", fontSize: 16 },
  remainingText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    textAlign: "center",
  },
});
