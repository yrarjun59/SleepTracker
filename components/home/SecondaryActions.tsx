import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

interface SecondaryActionsProps {
  onViewHistory: () => void;
  onAddPastSleep: () => void;
}

export function SecondaryActions({
  onViewHistory,
  onAddPastSleep,
}: SecondaryActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onViewHistory}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>View History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={onAddPastSleep}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>Add Past Sleep</Text>
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
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
});