import { getTodayQuote } from "@/services/quoteService";
import * as Notifications from "expo-notifications";

export async function setupNotificationChannels() {
  await Notifications.setNotificationChannelAsync("default", {
    name: "Sleep Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1B5E20",
  });
}

function dailyTrigger(
  hour: number,
  minute: number,
): Notifications.DailyTriggerInput {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
}

export async function scheduleBedtimeReminder(hour: number, minute: number) {
  await Notifications.cancelScheduledNotificationAsync("bedtime");

  await Notifications.scheduleNotificationAsync({
    identifier: "bedtime",
    content: {
      title: "Time for bed 💤",
      body: "A good night's sleep awaits you.",
      sound: true,
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
      sound: true,
      
    },
    trigger: dailyTrigger(hour, minute),
  });
}

export async function scheduleQuoteNotifications() {
  await Notifications.cancelScheduledNotificationAsync("quote");

  const hour = Math.floor(Math.random() * 12) + 9;
  const minute = Math.floor(Math.random() * 60);
  const quote = await getTodayQuote();

  await Notifications.scheduleNotificationAsync({
    identifier: "quote",
    content: {
      title: "💭 Sleep Wisdom",
      body: `"${quote.text}" — ${quote.author}`,
      sound: true,
      ...({ android: { channelId: "default" } } as any),
    },
    trigger: dailyTrigger(hour, minute),
  });
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
