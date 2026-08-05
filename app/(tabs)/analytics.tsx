import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Charts & history coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedForeground,
  },
});