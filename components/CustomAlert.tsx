// components/CustomAlert.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface AlertAction {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress: () => void;
}

export interface CustomAlertConfig {
  visible: boolean;
  type?: "info" | "success" | "error" | "warning" | "confirm";
  title: string;
  message: string;
  actions?: AlertAction[];
  autoDismiss?: boolean;
  onClose?: () => void;
}

export function CustomAlert({
  visible,
  type = "info",
  title,
  message,
  actions = [{ text: "OK", onPress: () => {} }],
  autoDismiss = false,
  onClose,
}: CustomAlertConfig) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (autoDismiss) {
        const timer = setTimeout(() => {
          onClose?.();
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, autoDismiss]);

  // Determine accent color based on type
  const accentColor = {
    info: colors.accent,
    success: colors.success,
    error: colors.destructive,
    warning: colors.warning,
    confirm: colors.accent,
  }[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!autoDismiss) onClose?.();
      }}
    >
      <View
        style={[
          styles.overlay,
          type === "confirm" && { justifyContent: "center" },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            type === "confirm" && { marginTop: 0 },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
            <Text style={styles.iconText}>
              {type === "success"
                ? "✓"
                : type === "error"
                  ? "✕"
                  : type === "warning"
                    ? "!"
                    : "i"}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {!autoDismiss && actions.length > 0 && (
            <View style={styles.buttonRow}>
              {actions.map((action, i) => {
                const isCancel = action.style === "cancel";
                const isDestructive = action.style === "destructive";
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.button,
                      isCancel
                        ? [styles.cancelButton, { borderColor: colors.border }]
                        : {},
                      isDestructive
                        ? { backgroundColor: colors.destructive }
                        : {},
                      !isCancel && !isDestructive
                        ? { backgroundColor: colors.accent }
                        : {},
                    ]}
                    onPress={() => {
                      action.onPress();
                      onClose?.();
                    }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && { color: colors.textSecondary },
                        isDestructive && { color: "#FFFFFF" },
                        !isCancel && !isDestructive && { color: "#FFFFFF" },
                      ]}
                    >
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 24,
  },
  container: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 60,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
