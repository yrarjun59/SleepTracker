import { Colors } from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface RecordButtonProps {
  title: string;
  onPress: () => void;
  isSleeping?: boolean;
}

export function RecordButton({
  title,
  onPress,
  isSleeping = false,
}: RecordButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isSleeping && styles.buttonSleeping]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 64,
    marginHorizontal: 20,
    borderRadius: 32, // ← fully rounded (pill shape)
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonSleeping: {
    backgroundColor: "#2E7D32",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
