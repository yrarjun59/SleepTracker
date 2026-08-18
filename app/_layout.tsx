import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertProvider } from "@/contexts/AlertContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SleepEntriesProvider } from "@/contexts/SleepEntriesContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import {
  startQuoteRefresher,
  stopQuoteRefresher,
} from "@/services/quoteService";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
// 1) Inner component – can safely use `useTheme`
function AppContent() {
  const { mode } = useTheme();

  useEffect(() => {
    startQuoteRefresher();
    return () => stopQuoteRefresher();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, headerBackButtonMenuEnabled: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

// 2) RootLayout – only provides the context wrappers
export default function RootLayout() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
          <NotificationProvider>
            <SettingsProvider>
              <SleepEntriesProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </SleepEntriesProvider>
            </SettingsProvider>
          </NotificationProvider>
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
