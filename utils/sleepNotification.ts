import * as Notifications from "expo-notifications";

const ACTIVE_SLEEP_NOTIFICATION_ID = "sleep-active";

export async function showSleepingNotification() {
  // Make sure the Android channel exists (required for sound & priority)
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
  });

  // Show the notification immediately (trigger: null)
  await Notifications.scheduleNotificationAsync({
    identifier: ACTIVE_SLEEP_NOTIFICATION_ID,
    content: {
      title: "Sleep Tracker",
      body: "Sleeping…",
      autoDismiss: false, // keeps it in the tray
      sticky: true, // Android ongoing notification
      sound: false,
    },
    trigger: null, // 👈 immediate, no delay
  });
}

export async function dismissSleepingNotification() {
  await Notifications.dismissNotificationAsync(ACTIVE_SLEEP_NOTIFICATION_ID);
}
