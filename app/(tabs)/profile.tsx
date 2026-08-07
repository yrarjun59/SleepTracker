import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all sleep records. You'll start fresh. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              "@sleep_entries",
              "@incomplete_sleep",
            ]);
            Alert.alert("Done", "All sleep data cleared.");
            // Optionally navigate to Home tab after clearing
            router.replace("/(tabs)");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Settings & more in V2</Text>

      <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
        <Text style={styles.clearButtonText}>Clear All Data</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 40,
  },
  clearButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
