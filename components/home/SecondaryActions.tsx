import { useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SecondaryActionsProps {
  onViewHistory: () => void;
  onAddPastSleep: () => void;
}

export function SecondaryActions({
  onViewHistory,
  onAddPastSleep,
}: SecondaryActionsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { borderColor: colors.border }]}
        onPress={onViewHistory}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, { color: colors.primary }]}>
          View History
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { borderColor: colors.border }]}
        onPress={onAddPastSleep}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, { color: colors.primary }]}>
          Add Past Sleep
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
