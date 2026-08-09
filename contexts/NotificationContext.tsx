import {
    cancelAllScheduledNotifications,
    scheduleBedtimeReminder,
    scheduleQuoteNotifications,
    scheduleWakeupReminder,
} from "@/utils/notificationScheduler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

export interface NotifPreferences {
  bedtime: string; // "22:00"
  wakeupTime: string; // "07:00"
  quoteNotifications: boolean;
  setupComplete: boolean;
}

interface NotificationContextType {
  prefs: NotifPreferences;
  updatePrefs: (p: Partial<NotifPreferences>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleAll: () => Promise<void>;
  cancelAll: () => Promise<void>;
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

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<NotifPreferences>(defaultPrefs);

  // Load saved prefs
  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem("@notif_prefs");
      if (json) setPrefs(JSON.parse(json));
    })();
  }, []);

  // Save prefs whenever they change
  useEffect(() => {
    AsyncStorage.setItem("@notif_prefs", JSON.stringify(prefs));
  }, [prefs]);

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

  // Schedule all reminders based on current prefs
  const scheduleAll = useCallback(async () => {
    const [bedHour, bedMin] = prefs.bedtime.split(":").map(Number);
    const [wakeHour, wakeMin] = prefs.wakeupTime.split(":").map(Number);

    await scheduleBedtimeReminder(bedHour, bedMin);
    await scheduleWakeupReminder(wakeHour, wakeMin);

    if (prefs.quoteNotifications) {
      await scheduleQuoteNotifications(); // hourly quotes (implementation later)
    } else {
      // Cancel any existing quote notifications (we'll add a helper)
    }
  }, [prefs]);

  // Cancel everything
  const cancelAll = useCallback(async () => {
    await cancelAllScheduledNotifications();
  }, []);

  // Automatically reschedule whenever prefs change (after initial load)
  useEffect(() => {
    if (prefs.setupComplete) {
      scheduleAll();
    }
  }, [
    prefs.setupComplete,
    prefs.bedtime,
    prefs.wakeupTime,
    prefs.quoteNotifications,
  ]);

  return (
    <NotificationContext.Provider
      value={{ prefs, updatePrefs, requestPermission, scheduleAll, cancelAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
