// components/onboarding/FirstTimeSetup.tsx
import { useAlert } from "@/contexts/AlertContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFormattedTime } from "@/utils/formatTime";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
import {
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
  onDismiss: () => void;
}

export function FirstTimeSetup({ visible, onDismiss }: Props) {
  const { colors } = useTheme();
  const { prefs, updatePrefs, requestPermission } = useNotifications();
  const { showAlert } = useAlert();
  const formatTime = useFormattedTime();
  const { timeFormat } = useSettings();
  const is24Hour = timeFormat === "24h";

  // Track whether user set custom times or left defaults
  const [hasCustomTimes, setHasCustomTimes] = useState(false);

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

  const isPickerOpen = useRef(false);

  const [step, setStep] = useState(0);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

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
      bedtimeReminderEnabled: true,
      wakeupReminderEnabled: true,
    });
    const bedtimeStr = formatTime(bedtimeDate);
    const wakeupStr = formatTime(wakeupDate);

    showAlert({
      type: "success",
      title: "Sleep Times Set",
      message: hasCustomTimes
        ? `Your usual sleep times have been saved.\nBedtime: ${bedtimeStr}\nWake-up: ${wakeupStr}`
        : `Using default sleep times.\nBedtime: ${bedtimeStr}\nWake-up: ${wakeupStr}`,
      autoDismiss: true,
    });

    onDismiss();
  };

  // Android picker effect
  useEffect(() => {
    if (pickerTarget === null || Platform.OS !== "android") return;
    if (isPickerOpen.current) return;

    isPickerOpen.current = true;
    const currentDate = pickerTarget === "bedtime" ? bedtimeDate : wakeupDate;

    DateTimePickerAndroid.open({
      value: currentDate,
      mode: "time",
      is24Hour,
      onChange: (event, date) => {
        isPickerOpen.current = false;
        if (event.type === "set" && date) {
          if (pickerTarget === "bedtime") setBedtimeDate(date);
          else if (pickerTarget === "wakeup") setWakeupDate(date);
          setHasCustomTimes(true);
        }
        setPickerTarget(null);
      },
    });
  }, [pickerTarget]);

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Welcome to SleepTracker!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your sleep, get reminders, and sync across devices.
            </Text>
            <View style={styles.featureList}>
              <Text style={[styles.feature, { color: colors.textSecondary }]}>
                📊 Detailed sleep analytics
              </Text>
              <Text style={[styles.feature, { color: colors.textSecondary }]}>
                🔔 Gentle bedtime & wake‑up reminders
              </Text>
              <Text style={[styles.feature, { color: colors.textSecondary }]}>
                ☁️ Cloud backup with your Google account
              </Text>
              <Text style={[styles.feature, { color: colors.textSecondary }]}>
                📱 Works offline – data syncs when you're back online
              </Text>
            </View>
          </>
        );
      case 1:
        return (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Your data stays safe
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sleep entries are stored locally on your device. If you sign in
              with Google, they're also backed up to the cloud and synced
              automatically.
            </Text>
            <Text style={[styles.info, { color: colors.mutedForeground }]}>
              You can export or clear your data anytime in Profile.
            </Text>
          </>
        );
      case 2:
        return (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Set your usual sleep times (optional)
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We'll use these as your default reminders. You can change them
              anytime.
            </Text>

            <Text style={[styles.label, { color: colors.foreground }]}>
              Bedtime
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
              Wake‑up time
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
              You'll get a bedtime reminder at {formatTime(bedtimeDate)} and a
              wake‑up reminder at {formatTime(wakeupDate)}.
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.stepsIndicator}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === step
                      ? { backgroundColor: colors.accent }
                      : { backgroundColor: colors.muted },
                  ]}
                />
              ))}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.stepContent}
            >
              {renderStepContent()}
            </ScrollView>

            <View style={styles.navRow}>
              {step > 0 && step < totalSteps - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, { borderColor: colors.border }]}
                  onPress={() => setStep(step - 1)}
                >
                  <Text style={{ color: colors.textSecondary }}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: colors.accent }]}
                onPress={handleNext}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {step === totalSteps - 1 ? "Get Started" : "Next"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* iOS picker */}
      {pickerTarget !== null && Platform.OS === "ios" && (
        <DateTimePicker
          value={pickerTarget === "bedtime" ? bedtimeDate : wakeupDate}
          mode="time"
          display="spinner"
          is24Hour={is24Hour}
          onChange={(event, date) => {
            if (date) {
              if (pickerTarget === "bedtime") setBedtimeDate(date);
              else if (pickerTarget === "wakeup") setWakeupDate(date);
              setHasCustomTimes(true);
            }
            setPickerTarget(null);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheetContainer: {
    width: "100%",
    justifyContent: "center",
  },
  sheet: {
    borderRadius: 24,
    padding: 24,
    maxHeight: "100%",
    width: "100%",
  },
  stepsIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    minHeight: 250,
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
  featureList: {
    gap: 12,
    marginTop: 12,
  },
  feature: {
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: 12,
  },
  dateButtonText: { fontSize: 16 },
  info: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 24,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
