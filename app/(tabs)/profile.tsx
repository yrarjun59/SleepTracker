import { SettingsRow } from "@/components/profile/SettingsRow";
import { Colors } from "@/constants/Colors";
import { useAlert } from "@/contexts/AlertContext";
import * as sleepStorage from "@/services/sleepStorage";
import { SleepEntry } from "@/types/sleep";
import { entriesToCSV, parseCSV } from "@/utils/csvHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";

import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [importing, setImporting] = useState(false);
  const [working, setWorking] = useState(false);

  const handleClearData = () => {
    showAlert({
      type: "warning",
      title: "Clear All Data",
      message: "This will permanently delete all sleep records. Continue?",
      actions: [
        { text: "Cancel", style: "cancel", onPress: () => {} },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setWorking(true);
            await AsyncStorage.multiRemove([
              "@sleep_entries",
              "@incomplete_sleep",
            ]);
            setWorking(false);

            // Use a non‑blocking success toast
            showAlert({
              type: "success",
              title: "Done",
              message: "All sleep data cleared.",
              autoDismiss: true,
            });
            router.replace("/(tabs)");
          },
        },
      ],
    });
  };

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

      // ---- Filter out future dates ----
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const pastAndTodayEntries = importedEntries.filter(
        (entry) => entry.date <= todayStr,
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

      // ---- Check duplicates ----
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
              for (const entry of newEntries) {
                try {
                  await sleepStorage.addManualEntry(entry);
                  imported++;
                } catch (e) {
                  console.warn("Skipping entry:", e);
                }
              }
              setImporting(false);
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
      setImporting(false);
      showAlert({
        type: "error",
        title: "Import failed",
        message: error.message || "Could not import file.",
        autoDismiss: false,
      });
    }
  };

  const handleExport = async () => {
    try {
      setWorking(true);
      const allEntries = await sleepStorage.getAllEntries();
      if (allEntries.length === 0) {
        showAlert({
          type: "info",
          title: "No data",
          message: "There are no sleep entries to export.",
          autoDismiss: true,
        });
        setWorking(false);
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
              onPress: () => setWorking(false),
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
      console.error("❌ Export failed:", error);
      showAlert({
        type: "error",
        title: "Export failed",
        message: "Could not export data. Please try again.",
        autoDismiss: true,
      });
      setWorking(false);
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

      console.log("✅ Export successful");
      console.log("   File name:", fileName);
      console.log("   Full path:", localPath);

      showAlert({
        type: "success",
        title: "Saved",
        message: `Saved as ${fileName}`,
        autoDismiss: true,
      });
    } catch (error) {
      console.error("❌ Export failed:", error);
      showAlert({
        type: "error",
        title: "Export failed",
        message: "Could not export data. Please try again.",
        autoDismiss: true,
      });
    } finally {
      setWorking(false);
    }
  };
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        {/* App Settings */}
        <Text style={styles.sectionHeader}>App Settings</Text>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon="cloud-download-outline"
            label="Import Data"
            onPress={handleImport}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="share-outline"
            label="Export Data"
            onPress={handleExport}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.settingsCard}>
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
          <View style={styles.divider} />
          <SettingsRow
            icon="trash-outline"
            label="Clear All Data"
            destructive
            onPress={handleClearData}
            showArrow={false}
          />
        </View>

        <Text style={styles.versionText}>VERSION 1.0.0</Text>
      </ScrollView>

      {importing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Importing data…</Text>
        </View>
      )}

      {working && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Please wait…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 24 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.foreground,
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 20,
  },
  settingsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  versionText: {
    fontSize: 11,
    color: Colors.mutedForeground,
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
  loadingText: {
    color: Colors.foreground,
    marginTop: 12,
    fontSize: 16,
  },
});
