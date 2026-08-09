// components/onboarding/FirstTimeSetup.tsx
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFormattedTime } from "@/utils/formatTime";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function FirstTimeSetup({ visible, onDismiss }: Props) {
  const { colors, mode } = useTheme();
  const { prefs, updatePrefs, requestPermission } = useNotifications();
  const formatTime = useFormattedTime();

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

  const handleSave = async () => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const bedtime = `${pad(bedtimeDate.getHours())}:${pad(bedtimeDate.getMinutes())}`;
    const wakeup = `${pad(wakeupDate.getHours())}:${pad(wakeupDate.getMinutes())}`;

    await requestPermission();
    await updatePrefs({
      bedtime,
      wakeupTime: wakeup,
      quoteNotifications: true,
      setupComplete: true,
    });

    onDismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Welcome to SleepTracker!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We’ll help you build a better sleep routine. Set your usual
              bedtime and wake‑up time for gentle reminders.
            </Text>

            <Text style={[styles.label, { color: colors.foreground }]}>
              Your usual bedtime
            </Text>
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

            <Text style={[styles.label, { color: colors.foreground }]}>
              Your usual wake‑up time
            </Text>
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

            <Text style={[styles.info, { color: colors.mutedForeground }]}>
              You can change these times anytime in Settings → Notifications.
              Your data is stored locally and synced to the cloud when you sign
              in.
            </Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save & Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

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
        theme={mode} // follows light/dark
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
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  dateButtonText: { fontSize: 16 },
  info: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 24,
  },
  button: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
