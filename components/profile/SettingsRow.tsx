import { useTheme } from "@/contexts/ThemeContext";
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
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: destructive
                ? colors.destructive + "20"
                : colors.accent + "20",
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? colors.destructive : colors.accent}
          />
        </View>
        <Text
          style={[
            styles.label,
            { color: destructive ? colors.destructive : colors.foreground },
          ]}
        >
          {label}
        </Text>
      </View>
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.mutedForeground}
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
  },
});
