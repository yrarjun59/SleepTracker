import * as Notifications from "expo-notifications";

// Helper that satisfies the trigger type without changing the API
function dailyTrigger(hour: number, minute: number) {
  return {
    type: "daily",
    hour,
    minute,
  } as Notifications.NotificationTriggerInput;
}

export async function scheduleBedtimeReminder(hour: number, minute: number) {
  await Notifications.cancelScheduledNotificationAsync("bedtime");
  await Notifications.scheduleNotificationAsync({
    identifier: "bedtime",
    content: {
      title: "Time for bed 💤",
      body: "A good night's sleep awaits you.",
    },
    trigger: dailyTrigger(hour, minute),
  });
}

export async function scheduleWakeupReminder(hour: number, minute: number) {
  await Notifications.cancelScheduledNotificationAsync("wakeup");
  await Notifications.scheduleNotificationAsync({
    identifier: "wakeup",
    content: {
      title: "Good morning ☀️",
      body: "Rise and shine! Ready to track your day?",
    },
    trigger: dailyTrigger(hour, minute),
  });
}

/**
 * Schedule up to 5 quote notifications spread throughout the day.
 */
export async function scheduleQuoteNotifications() {
  const times = [
    { hour: 9, minute: 0 },
    { hour: 12, minute: 0 },
    { hour: 15, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 0 },
  ];

  // Cancel old quote notifications
  for (let i = 0; i < 5; i++) {
    await Notifications.cancelScheduledNotificationAsync(`quote-${i}`);
  }

  // Schedule new ones
  for (let i = 0; i < times.length; i++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `quote-${i}`,
      content: {
        title: "💭 Sleep Wisdom",
        body: "A good laugh and a long sleep are the best cures.",
      },
      trigger: dailyTrigger(times[i].hour, times[i].minute),
    });
  }
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
