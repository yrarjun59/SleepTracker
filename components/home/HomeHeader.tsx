import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

interface HomeHeaderProps {
  date: string; // e.g. "Monday, Jan 22"
}

export function HomeHeader({ date }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep Tracker</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.foreground,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});