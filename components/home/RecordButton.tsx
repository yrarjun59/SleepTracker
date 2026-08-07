import { Colors } from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface RecordButtonProps {
  title: string;
  onPress: () => void;
}

export function RecordButton({ title, onPress }: RecordButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={title}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    width: 100, // finger‑friendly diameter
    height: 100,
    borderRadius: 50, // fully round
    alignSelf: "center", // centered horizontally
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
