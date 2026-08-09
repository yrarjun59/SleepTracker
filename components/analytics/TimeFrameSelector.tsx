import { useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type Period = "Week" | "Month" | "Year" | "All";

interface Props {
  active: Period;
  onSelect: (p: Period) => void;
}

const PERIODS: Period[] = ["Week", "Month", "Year", "All"];

export function TimeFrameSelector({ active, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {PERIODS.map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.pill,
            { backgroundColor: active === p ? colors.accent : colors.muted },
          ]}
          onPress={() => onSelect(p)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillText,
              { color: active === p ? "#FFFFFF" : colors.textSecondary },
            ]}
          >
            {p}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
