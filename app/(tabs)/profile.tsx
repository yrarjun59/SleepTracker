// app/(tabs)/profile.tsx
import { ConfirmClearDataModal } from "@/components/ConfirmClearDataModal";
import { NotificationSettingsModal } from "@/components/profile/NotificationSettingsModal";
import { SettingsRow } from "@/components/profile/SettingsRow";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
// import { useSleepEntries } from "@/hooks/old.useSleepEntries";
import { useSleepEntries } from "@/contexts/SleepEntriesContext";
import { deleteAllUserEntries, pushEntry } from "@/services/cloudStorage";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import { entriesToCSV, parseCSV } from "@/utils/csvHelper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { user, profile, signInWithGoogle, logout, authLoading, signInError } =
    useAuth();
  const { timeFormat, setTimeFormat } = useSettings();
  const { colors } = useTheme();

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [working, setWorking] = useState(false);
  const [workingMessage, setWorkingMessage] = useState("");
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { refresh, syncError, lastSyncedAt } = useSleepEntries();

  useEffect(() => {
    if (signInError) {
      showAlert({
        type: "error",
        title: "Google Sign-In Failed",
        message: signInError,
        autoDismiss: false,
      });
    }
  }, [signInError]);

  useEffect(() => {
    if (syncError) {
      showAlert({
        type: "warning",
        title: "Sync Issue",
        message: syncError,
        autoDismiss: false,
      });
    }
  }, [syncError]);

  // ---------- Import ----------
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv"],
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      let csvText = "";

      if (Platform.OS === "web") {
        const response = await fetch(file.uri);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        csvText = await response.text();
      } else {
        const tempFile = FileSystem.cacheDirectory + "temp_import.csv";
        await FileSystem.copyAsync({ from: file.uri, to: tempFile });
        csvText = await FileSystem.readAsStringAsync(tempFile, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(
          () => {},
        );
      }

      const importedEntries = parseCSV(csvText);

      if (importedEntries.length === 0) {
        showAlert({
          type: "info",
          title: "No entries",
          message: "No valid entries found.",
          autoDismiss: true,
        });
        return;
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const pastAndTodayEntries = importedEntries.filter(
        (e) => e.date <= todayStr,
      );
      const futureCount = importedEntries.length - pastAndTodayEntries.length;

      if (pastAndTodayEntries.length === 0) {
        showAlert({
          type: "info",
          title: "No valid entries",
          message: `All ${futureCount} entries are in the future and were skipped.`,
          autoDismiss: true,
        });
        return;
      }

      const allEntries = await sleepStorage.getAllEntries();
      const newEntries: Array<Omit<SleepEntry, "id" | "createdAt">> = [];
      const skippedDates: string[] = [];

      for (const entry of pastAndTodayEntries) {
        const duplicate = allEntries.find((e) => e.date === entry.date);
        if (duplicate) {
          skippedDates.push(entry.date);
          continue;
        }
        newEntries.push(entry);
      }

      if (newEntries.length === 0) {
        showAlert({
          type: "info",
          title: "No new entries",
          message: "All entries already exist or are duplicates.",
          autoDismiss: true,
        });
        return;
      }

      showAlert({
        type: "confirm",
        title: "Import Data",
        message: `Found ${newEntries.length} new entries.${
          futureCount > 0 ? `\n${futureCount} future entries skipped.` : ""
        }${skippedDates.length > 0 ? `\n${skippedDates.length} duplicates skipped.` : ""} Import?`,
        actions: [
          { text: "Cancel", style: "cancel", onPress: () => {} },
          {
            text: "Import",
            onPress: async () => {
              setImporting(true);
              let imported = 0;
              const total = newEntries.length;

              for (const entry of newEntries) {
                try {
                  const newEntry = await sleepStorage.addManualEntry(entry);
                  imported++;
                  setImportProgress(`Imported ${imported} / ${total}…`);

                  if (user) {
                    try {
                      await pushEntry(user.uid, newEntry);
                    } catch (cloudErr) {
                      console.warn("Cloud push failed:", cloudErr);
                    }
                  }
                } catch (e) {
                  console.warn("Skipping entry:", e);
                }
              }

              setImporting(false);
              setImportProgress("");
              showAlert({
                type: "success",
                title: "Import complete",
                message: `${imported} entries imported.`,
                autoDismiss: true,
              });
            },
          },
        ],
      });
    } catch (error: any) {
      console.error("Import error:", error);
      showAlert({
        type: "error",
        title: "Import failed",
        message: error.message || "Could not import file.",
        autoDismiss: false,
      });
    } finally {
      setImporting(false);
      setImportProgress("");
    }
  };

  // ---------- Export ----------
  const handleExport = async () => {
    try {
      setWorking(true);
      setWorkingMessage("Preparing export…");
      const allEntries = await sleepStorage.getAllEntries();
      if (allEntries.length === 0) {
        showAlert({
          type: "info",
          title: "No data",
          message: "There are no sleep entries to export.",
          autoDismiss: true,
        });
        setWorking(false);
        setWorkingMessage("");
        return;
      }

      if (allEntries.length < 7) {
        showAlert({
          type: "confirm",
          title: "Just a few entries",
          message: `You only have ${allEntries.length} sleep entries. The file will be small. Export anyway?`,
          actions: [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setWorking(false);
                setWorkingMessage("");
              },
            },
            {
              text: "Export",
              onPress: async () => {
                await performExport(allEntries);
              },
            },
          ],
        });
        return;
      }

      await performExport(allEntries);
    } catch (error) {
      console.error("Export failed:", error);
      showAlert({
        type: "error",
        title: "Export failed",
        message: "Could not export data. Please try again.",
        autoDismiss: true,
      });
      setWorking(false);
      setWorkingMessage("");
    }
  };

  const performExport = async (entries: SleepEntry[]) => {
    try {
      const csv = entriesToCSV(entries);
      const today = new Date().toISOString().split("T")[0];
      const fileName = `${today}-sleepdata.csv`;
      const localPath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(localPath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localPath, {
          mimeType: "text/csv",
          dialogTitle: "Save your sleep data",
          UTI: "public.comma-separated-values-text",
        });
      }

      showAlert({
        type: "success",
        title: "Saved",
        message: `Saved as ${fileName}`,
        autoDismiss: true,
      });
    } catch (error) {
      console.error("Export failed:", error);
      showAlert({
        type: "error",
        title: "Export failed",
        message: "Could not export data. Please try again.",
        autoDismiss: true,
      });
    } finally {
      setWorking(false);
      setWorkingMessage("");
    }
  };

  // ---------- Clear All Data (GitHub-style confirmation) ----------
  const handleClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllData = async () => {
    setWorking(true);
    setWorkingMessage("Clearing data…");
    try {
      if (user) {
        try {
          await deleteAllUserEntries(user.uid);
        } catch (cloudError) {
          console.warn("Cloud deletion failed (continuing):", cloudError);
        }
      }

      await AsyncStorage.multiRemove(["@sleep_entries", "@incomplete_sleep"]);
      refresh();

      showAlert({
        type: "success",
        title: "Done",
        message: "All data cleared.",
        autoDismiss: true,
      });
      router.replace("/(tabs)");
    } catch (error) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Could not clear data. Please try again.",
        autoDismiss: true,
      });
    } finally {
      setWorking(false);
      setWorkingMessage("");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Profile
        </Text>

        {/* User section */}
        <View style={styles.userSection}>
          {authLoading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : user && profile ? (
            <>
              <Image
                source={{ uri: profile.photo }}
                style={[styles.avatar, { borderColor: colors.border }]}
              />
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {profile.name}
              </Text>
              <View style={styles.syncRow}>
                <Ionicons
                  name="cloud-done-outline"
                  size={16}
                  color={colors.mutedForeground}
                  style={{ opacity: 0.8, marginRight: 6 }}
                />
                <Text
                  style={[styles.syncMessage, { color: colors.textSecondary }]}
                >
                  Your sleep data is backed up to the cloud.
                </Text>
              </View>

              {user && lastSyncedAt && (
                <Text
                  style={[styles.syncStatus, { color: colors.textSecondary }]}
                >
                  Last synced {lastSyncedAt.toLocaleTimeString()}
                </Text>
              )}
            </>
          ) : (
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => {
                  console.log("👆 Sign in with Google button pressed");
                  signInWithGoogle().catch(() => {});
                }}
              >
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
              <Text style={[styles.syncHint, { color: colors.textSecondary }]}>
                sign in to back up your data
              </Text>
            </View>
          )}
        </View>

        {/* App Settings */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          App Settings
        </Text>
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Time Format Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: colors.accent + "20" },
                ]}
              >
                <Ionicons name="time-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                Time Format
              </Text>
            </View>
            <View style={styles.toggleRight}>
              <Text
                style={[styles.toggleValue, { color: colors.textSecondary }]}
              >
                {timeFormat === "12h" ? "12-hour" : "24-hour"}
              </Text>
              <Switch
                value={timeFormat === "24h"}
                onValueChange={(val) => setTimeFormat(val ? "24h" : "12h")}
                trackColor={{ false: colors.muted, true: colors.accent }}
                thumbColor={colors.foreground}
              />
            </View>
          </View>

          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => setShowNotifSettings(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="cloud-download-outline"
            label="Import Data"
            onPress={handleImport}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="share-outline"
            label="Export Data"
            onPress={handleExport}
          />
        </View>

        {/* Support */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
          Support
        </Text>
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingsRow
            icon="information-circle-outline"
            label="About"
            onPress={() =>
              showAlert({
                type: "info",
                title: "About",
                message: "Sleep Tracker V1 – simple, private, local.",
                autoDismiss: true,
              })
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-outline"
            label="Clear All Data"
            destructive
            onPress={handleClearData}
            showArrow={false}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {user && (
            <SettingsRow
              icon="log-out-outline"
              label="Sign Out"
              destructive
              onPress={async () => {
                await logout();
                showAlert({
                  type: "success",
                  title: "Logged out",
                  message: "You have been logged out.",
                  autoDismiss: true,
                });
                router.replace("/(tabs)");
              }}
              showArrow={false}
            />
          )}
        </View>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          VERSION 1.0.0
        </Text>
      </ScrollView>

      {/* Loading overlay */}
      {(importing || working) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          {importProgress ? (
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              {importProgress}
            </Text>
          ) : workingMessage ? (
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              {workingMessage}
            </Text>
          ) : (
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              Please wait…
            </Text>
          )}
        </View>
      )}

      {/* Notification settings modal */}
      <NotificationSettingsModal
        visible={showNotifSettings}
        onClose={() => setShowNotifSettings(false)}
      />

      {/* Clear data confirmation modal */}
      <ConfirmClearDataModal
        visible={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          confirmClearAllData();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  userSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  syncHint: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    marginBottom: 8,
  },
  googleButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 20,
  },
  settingsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  divider: { height: 1, marginHorizontal: 16 },
  versionText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
    letterSpacing: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: { marginTop: 12, fontSize: 16 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  toggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleValue: {
    fontSize: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  syncMessage: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    opacity: 0.6,
  },
  syncStatus: {
    fontSize: 12,
    marginTop: 4,
  },
});
