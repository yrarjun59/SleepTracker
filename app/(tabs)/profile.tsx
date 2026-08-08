import { SettingsRow } from "@/components/profile/SettingsRow";
import { Colors } from "@/constants/Colors";
import { useAlert } from "@/contexts/AlertContext";
import * as sleepStorage from "@/services/sleepStorage";
import { parseCSV } from "@/utils/csvHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();

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
            await AsyncStorage.multiRemove([
              "@sleep_entries",
              "@incomplete_sleep",
            ]);
            showAlert({
              type: "success",
              title: "Done",
              message: "All data cleared.",
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
        // Do NOT copy to cache – fetch reads the original content URI directly
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Fetch the file from its URI – works on Android (content://), iOS, and web
      const response = await fetch(file.uri);
      if (!response.ok) {
        throw new Error(`Could not read file (status ${response.status})`);
      }
      const content = await response.text();

      const importedEntries = parseCSV(content);

      if (importedEntries.length === 0) {
        showAlert({
          type: "info",
          title: "No entries",
          message: "No valid entries found in the file.",
          autoDismiss: true,
        });
        return;
      }

      showAlert({
        type: "confirm",
        title: "Import Data",
        message: `Found ${importedEntries.length} entries. Import?`,
        actions: [
          { text: "Cancel", style: "cancel", onPress: () => {} },
          {
            text: "Import",
            onPress: async () => {
              let imported = 0;
              for (const entry of importedEntries) {
                try {
                  await sleepStorage.addManualEntry(entry);
                  imported++;
                } catch (e) {
                  console.warn("Skipping entry:", e);
                }
              }
              showAlert({
                type: "success",
                title: "Import complete",
                message: `${imported}/${importedEntries.length} entries imported.`,
                autoDismiss: true,
              });
            },
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        type: "error",
        title: "Import failed",
        message:
          error.message || "Could not import file. Please check the format.",
        autoDismiss: false,
      });
    }
  };

  const handleExport = async () => {};

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
});
