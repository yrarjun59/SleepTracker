import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HomeHeaderProps {
  date: string;
}

export function HomeHeader({ date }: HomeHeaderProps) {
  const { colors, mode, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Theme button on the left */}
      <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
        <Ionicons
          name={mode === "dark" ? "sunny-outline" : "moon-outline"}
          size={24}
          color={colors.accent}
        />
      </TouchableOpacity>

      {/* Title and date */}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Sleep Tracker
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {date}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  themeButton: {
    marginRight: 16,
    padding: 4,
    borderRadius: 20,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
});
