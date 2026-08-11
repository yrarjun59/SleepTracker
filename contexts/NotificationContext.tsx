import {
  cancelAllScheduledNotifications,
  scheduleBedtimeReminder,
  scheduleQuoteNotifications,
  scheduleWakeupReminder,
} from "@/utils/notificationScheduler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ---------- Types ----------
export interface NotifPreferences {
  bedtime: string;
  wakeupTime: string;
  quoteNotifications: boolean;
  setupComplete: boolean;
}

interface NotificationContextType {
  prefs: NotifPreferences;
  updatePrefs: (p: Partial<NotifPreferences>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleAll: () => Promise<void>;
  cancelAll: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const defaultPrefs: NotifPreferences = {
  bedtime: "22:00",
  wakeupTime: "07:00",
  quoteNotifications: true,
  setupComplete: false,
};

// ---------- Provider ----------
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<NotifPreferences>(defaultPrefs);
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // 1. Load persisted prefs
  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem("@notif_prefs");
      if (json) {
        const p = JSON.parse(json);
        console.log("📂 Loaded prefs:", p);
        setPrefs(p);
      }
      setLoading(false);
    })();
  }, []);

  // 2. Save prefs whenever they change
  useEffect(() => {
    AsyncStorage.setItem("@notif_prefs", JSON.stringify(prefs));
  }, [prefs]);

  // 3. Create Android notification channel
  useEffect(() => {
    (async () => {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    })();
  }, []);

  const updatePrefs = useCallback(
    async (partial: Partial<NotifPreferences>) => {
      setPrefs((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  };

  // 4. Schedule all reminders based on current prefs
  const scheduleAll = useCallback(async () => {
    console.log("🔔 scheduleAll called with prefs:", prefs);

    const [bedHour, bedMin] = prefs.bedtime.split(":").map(Number);
    const [wakeHour, wakeMin] = prefs.wakeupTime.split(":").map(Number);

    await scheduleBedtimeReminder(bedHour, bedMin);
    await scheduleWakeupReminder(wakeHour, wakeMin);

    if (prefs.quoteNotifications) {
      await scheduleQuoteNotifications();
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log("📋 All scheduled after reschedule:");
    scheduled.forEach((n) =>
      console.log(
        `  • ${n.identifier} → trigger: ${JSON.stringify(n.trigger)}, title: "${n.content.title}"`,
      ),
    );
  }, [prefs]);

  const cancelAll = useCallback(async () => {
    await cancelAllScheduledNotifications();
  }, []);

  // 5. Auto‑reschedule when prefs change (only if setup is complete)
  useEffect(() => {
    if (prefs.setupComplete) {
      console.log("⏰ Auto‑rescheduling because prefs changed");
      scheduleAll();
    }
  }, [
    prefs.setupComplete,
    prefs.bedtime,
    prefs.wakeupTime,
    prefs.quoteNotifications,
  ]);

  // 6. Handle notification taps → navigate to Home for bedtime/wake‑up
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const identifier = response.notification.request.identifier;
        if (identifier === "bedtime" || identifier === "wakeup") {
          router.push("/(tabs)");
        }
      },
    );
    return () => subscription.remove();
  }, [router]);

  return (
    <NotificationContext.Provider
      value={{
        prefs,
        updatePrefs,
        requestPermission,
        scheduleAll,
        cancelAll,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ---------- Hook ----------
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
