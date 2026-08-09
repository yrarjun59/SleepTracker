// components/profile/NotificationSettingsModal.tsx
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFormattedTime } from "@/utils/formatTime";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const { colors, mode } = useTheme();
  const { prefs, updatePrefs } = useNotifications();
  const formatTime = useFormattedTime();

  // Convert stored "HH:MM" to Date objects
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

  // Save the current picker values to prefs
  const saveTimes = async () => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const bedtime = `${pad(bedtimeDate.getHours())}:${pad(bedtimeDate.getMinutes())}`;
    const wakeup = `${pad(wakeupDate.getHours())}:${pad(wakeupDate.getMinutes())}`;
    await updatePrefs({ bedtime, wakeupTime: wakeup });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Notification Settings
            </Text>

            {/* Bedtime reminder toggle */}
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
                onValueChange={(value) => updatePrefs({ setupComplete: value })}
                trackColor={{ false: colors.muted, true: colors.accent }}
              />
            </View>

            {/* Bedtime time picker */}
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
              onPress={() => setPickerTarget("bedtime")}
            >
              <Text
                style={[styles.dateButtonText, { color: colors.foreground }]}
              >
                {formatTime(bedtimeDate)}
              </Text>
            </TouchableOpacity>

            {/* Wake‑up time picker */}
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
              onPress={() => setPickerTarget("wakeup")}
            >
              <Text
                style={[styles.dateButtonText, { color: colors.foreground }]}
              >
                {formatTime(wakeupDate)}
              </Text>
            </TouchableOpacity>

            {/* Quote notifications toggle */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Daily sleep quotes
                </Text>
                <Text
                  style={[styles.sublabel, { color: colors.textSecondary }]}
                >
                  Receive 5 inspirational quotes throughout the day
                </Text>
              </View>
              <Switch
                value={prefs.quoteNotifications}
                onValueChange={(value) =>
                  updatePrefs({ quoteNotifications: value })
                }
                trackColor={{ false: colors.muted, true: colors.accent }}
              />
            </View>

            <Text style={[styles.note, { color: colors.mutedForeground }]}>
              Changes are saved automatically and will take effect immediately.
            </Text>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                saveTimes();
                onClose();
              }}
            >
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Time picker modal */}
      <DatePicker
        modal
        open={pickerTarget !== null}
        date={pickerTarget === "bedtime" ? bedtimeDate : wakeupDate}
        mode="time"
        onConfirm={(date) => {
          if (pickerTarget === "bedtime") setBedtimeDate(date);
          else if (pickerTarget === "wakeup") setWakeupDate(date);
          setPickerTarget(null);
        }}
        onCancel={() => setPickerTarget(null)}
        theme={mode} // follows the global dark/light theme
        title={
          pickerTarget === "bedtime" ? "Select bedtime" : "Select wake‑up time"
        }
      />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingRight: 4,
  },
  rowLeft: { flex: 1, marginRight: 16 },
  label: { fontSize: 15, fontWeight: "500" },
  sublabel: { fontSize: 12, marginTop: 2 },
  dateButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  dateButtonText: { fontSize: 16 },
  note: {
    fontSize: 12,
    marginTop: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  closeButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
