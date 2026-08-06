// components/home/AddPastSleepModal.tsx
import { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
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

  // We store hours & minutes separately for easier control
  const [sleepDayOffset, setSleepDayOffset] = useState(0); // 0 = today, -1 = yesterday, etc.
  const [wakeDayOffset, setWakeDayOffset] = useState(0);

  const [sleepHour, setSleepHour] = useState(23);
  const [sleepMinute, setSleepMinute] = useState(0);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);

  const createDate = (dayOffset: number, hour: number, minute: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const sleepDate = createDate(sleepDayOffset, sleepHour, sleepMinute);
  const wakeDate = createDate(wakeDayOffset, wakeHour, wakeMinute);

  const formatPreview = (date: Date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const handleSave = async () => {
    if (wakeDate <= sleepDate) {
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

  const DaySelector = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: number) => void;
  }) => (
    <View style={styles.selectorRow}>
      {[0, -1, -2].map((offset) => {
        const label =
          offset === 0 ? "Today" : offset === -1 ? "Yesterday" : "2 days ago";
        const active = value === offset;
        return (
          <TouchableOpacity
            key={offset}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(offset)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const TimeSelector = ({
    hour,
    minute,
    onHourChange,
    onMinuteChange,
  }: {
    hour: number;
    minute: number;
    onHourChange: (h: number) => void;
    onMinuteChange: (m: number) => void;
  }) => (
    <View style={styles.timeRow}>
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>Hour</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => onHourChange(hour === 0 ? 23 : hour - 1)}>
            <Text style={styles.stepperBtn}>−</Text>
          </TouchableOpacity>
          <Text style={styles.timeValue}>{hour.toString().padStart(2, "0")}</Text>
          <TouchableOpacity onPress={() => onHourChange(hour === 23 ? 0 : hour + 1)}>
            <Text style={styles.stepperBtn}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>Minute</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => onMinuteChange(minute === 0 ? 45 : minute - 15)}
          >
            <Text style={styles.stepperBtn}>−</Text>
          </TouchableOpacity>
          <Text style={styles.timeValue}>{minute.toString().padStart(2, "0")}</Text>
          <TouchableOpacity
            onPress={() => onMinuteChange(minute === 45 ? 0 : minute + 15)}
          >
            <Text style={styles.stepperBtn}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add Past Sleep</Text>
            <Text style={styles.subtitle}>All times are in your local timezone</Text>

            {/* Sleep */}
            <Text style={styles.section}>When did you go to sleep?</Text>
            <DaySelector value={sleepDayOffset} onChange={setSleepDayOffset} />
            <TimeSelector
              hour={sleepHour}
              minute={sleepMinute}
              onHourChange={setSleepHour}
              onMinuteChange={setSleepMinute}
            />

            {/* Wake */}
            <Text style={[styles.section, { marginTop: 28 }]}>
              When did you wake up?
            </Text>
            <DaySelector value={wakeDayOffset} onChange={setWakeDayOffset} />
            <TimeSelector
              hour={wakeHour}
              minute={wakeMinute}
              onHourChange={setWakeHour}
              onMinuteChange={setWakeMinute}
            />

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
  selectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.muted,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.foreground,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 6,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.muted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  stepperBtn: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  timeValue: {
    fontSize: 18,
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