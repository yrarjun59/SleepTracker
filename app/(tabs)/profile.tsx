import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Placeholder – coming later</Text>
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