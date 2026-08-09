import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddPastSleepModal } from "@/components/home/AddPastSleepModal";
import { HistoryModal } from "@/components/home/HistoryModal";
import { HoldToRecordButton } from "@/components/home/HoldToRecordButton";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RecordButton } from "@/components/home/RecordButton";
import { SecondaryActions } from "@/components/home/SecondaryActions";
import { TodaySleepCard } from "@/components/home/TodaySleepCard";
import { WeeklyComparisonCard } from "@/components/home/WeeklyComparisonCard";

import { useSleepEntries } from "@/hooks/useSleepEntries";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";
import {
  formatDuration,
  getElapsedMinutes,
  getElapsedTime,
  parseLocalDateTime,
} from "@/utils/dateHelpers";

import * as NavigationBar from "expo-navigation-bar";
import { useNavigation, usePathname } from "expo-router";

import { FirstTimeSetup } from "@/components/onboarding/FirstTimeSetupModal";
import { useNotifications } from "@/contexts/NotificationContext";

import { useFormattedTime } from "@/utils/formatTime";
import * as Haptics from "expo-haptics";

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

  const isSleeping = !!incomplete;

  const { prefs } = useNotifications();
  const [showOnboarding, setShowOnboarding] = useState(!prefs.setupComplete);

  const navigation = useNavigation();
  const pathname = usePathname();

  const { colors } = useTheme(); // 👈 theme hook

  // live timer for sleep
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

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: colors.card, // 👈 dynamic
        borderTopColor: colors.border, // 👈 dynamic
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
        display: isSleeping ? "none" : "flex",
      },
    });
  }, [isSleeping, navigation, colors]);

  useEffect(() => {
    if (!isSleeping) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    }

    return () => {
      backHandler.remove();
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible").catch(() => {});
      }
    };
  }, [isSleeping]);

  const formatTime = useFormattedTime();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "long" });
      const date = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const time = formatTime(now);
      const seconds = now.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${day}, ${date}  ${time}:${seconds}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [formatTime]);

  useEffect(() => {
    if (pathname === "/") {
      refresh();
    }
  }, [pathname, refresh]);

  // ---------- Handlers ----------
  const handleRecord = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startSleep();
  };

  const handleHoldComplete = async () => {
    const minutes = getElapsedMinutes(incomplete!.sleepTime);
    try {
      if (minutes >= 10) {
        await finishSleep();
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        await abortSleep();
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }
    } catch (error: any) {
      await abortSleep();
    }
  };

  // ========== FULL SCREEN SLEEPING MODE ==========
  if (isSleeping) {
    return (
      <View style={styles.sleepingScreen}>
        <View style={[styles.sleepingContent, { paddingTop: insets.top }]}>
          <Text style={styles.sleepingLabel}>SLEEPING</Text>
          <Text style={styles.sleepingSince}>
            Since {formatTime(parseLocalDateTime(incomplete.sleepTime))}
          </Text>
          <Text style={styles.sleepingTimer}>{elapsedLabel}</Text>

          <HoldToRecordButton onComplete={handleHoldComplete} />
        </View>
      </View>
    );
  }

  // ========== Loading ==========
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
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

  const lastCompletedEntry =
    entries
      .filter((e) => e.wakeTime !== null)
      .sort(
        (a, b) =>
          parseLocalDateTime(b.wakeTime!).getTime() -
          parseLocalDateTime(a.wakeTime!).getTime(),
      )[0] || null;

  // ========== NORMAL MODE ==========
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader date={currentTime} />

        <TodaySleepCard
          sleepTime={
            todayEntries.length === 1
              ? formatTime(parseLocalDateTime(todayEntries[0].sleepTime))
              : null
          }
          wakeTime={
            todayEntries.length === 1
              ? formatTime(parseLocalDateTime(todayEntries[0].wakeTime!))
              : null
          }
          duration={
            todayTotalDuration > 0 ? formatDuration(todayTotalDuration) : null
          }
          durationHours={
            todayTotalDuration > 0 ? todayTotalDuration : undefined
          }
          isEmpty={todayEntries.length === 0}
          napCount={napCount}
          lastCompletedEntry={lastCompletedEntry}
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
        onClose={() => setShowAddModal(false)}
        onSaved={refresh}
      />

      <HistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entries={entries}
      />

      <FirstTimeSetup
        visible={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
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
