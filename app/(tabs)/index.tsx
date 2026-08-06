import { Colors } from "@/constants/Colors";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddPastSleepModal } from "@/components/home/AddPastSleepModal";
import { HistoryModal } from "@/components/home/HistoryModal";
import { HoldToCancelButton } from "@/components/home/HoldToCancelButton";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RecordButton } from "@/components/home/RecordButton";
import { SecondaryActions } from "@/components/home/SecondaryActions";
import { TodaySleepCard } from "@/components/home/TodaySleepCard";
import { WeeklyComparisonCard } from "@/components/home/WeeklyComparisonCard";

import { useSleepEntries } from "@/hooks/useSleepEntries";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";
import { SleepEntry } from "@/types/sleep";

import {
  formatDuration,
  formatTime,
  getDateLabel,
  getElapsedMinutes,
  getElapsedTime,
} from "@/utils/dateHelpers";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    entries,
    incomplete,
    loading,
    startSleep,
    finishSleep,
    abortSleep,
    refresh,
  } = useSleepEntries();

  const { thisWeek, lastWeek, differenceMinutes } = useWeeklyStats(entries);

  const [elapsedLabel, setElapsedLabel] = useState("0m");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SleepEntry | undefined>(
    undefined,
  );

  const isSleeping = !!incomplete;

  // Live timer
  useEffect(() => {
    if (!incomplete) {
      setElapsedLabel("0m");
      return;
    }

    setElapsedLabel(getElapsedTime(incomplete.sleepTime));
    const interval = setInterval(() => {
      setElapsedLabel(getElapsedTime(incomplete.sleepTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [incomplete]);

  // ========== Handlers ==========
  const handleRecord = async () => {
    if (!isSleeping) {
      await startSleep();
      return;
    }

    const minutes = getElapsedMinutes(incomplete!.sleepTime);

    if (minutes < 10) {
      Alert.alert(
        "Too short",
        "Sleep must be at least 10 minutes.\n\nHold the button for 5 seconds to cancel this session.",
      );
      return;
    }

    try {
      await finishSleep();
    } catch (error: any) {
      if (error?.message === "MINIMUM_DURATION") {
        Alert.alert("Too short", "Sleep must be at least 10 minutes.");
      }
    }
  };

  const handleAbort = async () => {
    await abortSleep();
  };

  // ========== Loading ==========
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ========== FULL SCREEN SLEEPING MODE ==========
  if (isSleeping) {
    return (
      <View style={styles.sleepingScreen}>
        <View style={[styles.sleepingContent, { paddingTop: insets.top }]}>
          <Text style={styles.sleepingLabel}>SLEEPING</Text>
          <Text style={styles.sleepingSince}>
            Since {formatTime(incomplete.sleepTime)}
          </Text>
          <Text style={styles.sleepingTimer}>{elapsedLabel}</Text>

          <HoldToCancelButton
            onFinishPress={handleRecord}
            onComplete={handleAbort}
          />
        </View>
      </View>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter(
    (e) => e.date === today && e.wakeTime !== null,
  );
  const todayTotalDuration = todayEntries.reduce(
    (sum, e) => sum + (e.duration || 0),
    0,
  );
  const napCount = todayEntries.length;

  const hasEntries = entries.length > 0;
  // == NORMAL MODE ==
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader date={getDateLabel()} />

        <TodaySleepCard
          sleepTime={
            todayEntries.length === 1
              ? formatTime(todayEntries[0].sleepTime)
              : null
          }
          wakeTime={
            todayEntries.length === 1
              ? formatTime(todayEntries[0].wakeTime)
              : null
          }
          duration={
            todayTotalDuration > 0 ? formatDuration(todayTotalDuration) : null
          }
          durationHours={
            todayTotalDuration > 0 ? todayTotalDuration : undefined
          }
          isEmpty={todayEntries.length === 0} // ← only for today
          napCount={napCount}
        />

        <RecordButton title="Record Sleep" onPress={handleRecord} />

        <WeeklyComparisonCard
          thisWeek={thisWeek}
          lastWeek={lastWeek}
          differenceMinutes={differenceMinutes}
        />

        <SecondaryActions
          onViewHistory={() => setShowHistoryModal(true)}
          onAddPastSleep={() => setShowAddModal(true)}
        />
      </ScrollView>

      <AddPastSleepModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedEntry(undefined);
        }}
        onSaved={() => {
          refresh();
          setShowAddModal(false);
          setSelectedEntry(undefined);
        }}
        entryToEdit={selectedEntry}
      />

      <HistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entries={entries}
        onEdit={(entry) => {
          setSelectedEntry(entry);
          setShowHistoryModal(false); // close history modal
          setShowAddModal(true); // open add/edit modal
        }}
        onEntryUpdated={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ===== Full screen night mode =====
  sleepingScreen: {
    ...StyleSheet.absoluteFill, 
    backgroundColor: "#0B140F",
    zIndex: 999,
    elevation: 999,
  },
  sleepingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sleepingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 3,
    marginBottom: 12,
  },
  sleepingSince: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  sleepingTimer: {
    fontSize: 56,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 60,
  },
});
