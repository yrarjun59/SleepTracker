// components/profile/SettingsRow.tsx
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
  onPress: () => void;
  showArrow?: boolean;
}

export function SettingsRow({
  icon,
  label,
  destructive = false,
  onPress,
  showArrow = true,
}: SettingsRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconBox,
            destructive
              ? { backgroundColor: Colors.destructive + "20" }
              : { backgroundColor: Colors.accent + "20" },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? Colors.destructive : Colors.accent}
          />
        </View>
        <Text
          style={[styles.label, destructive && { color: Colors.destructive }]}
        >
          {label}
        </Text>
      </View>
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.mutedForeground}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.foreground,
  },
});
