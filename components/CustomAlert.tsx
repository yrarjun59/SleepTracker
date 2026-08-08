// components/CustomAlert.tsx
import { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Colors } from "@/constants/Colors";

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
  autoDismiss?: boolean;       // automatically close after 2s (ignores actions)
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss for success / info after 2 seconds
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

  // Determine the accent color based on type
  const accentColor = {
    info: Colors.accent,
    success: Colors.success,
    error: Colors.destructive,
    warning: Colors.warning,
    confirm: Colors.accent,
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
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Optional icon */}
          <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
            <Text style={styles.iconText}>
              {type === "success" ? "✓" : type === "error" ? "✕" : type === "warning" ? "!" : "i"}
            </Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Buttons – hidden for auto-dismiss alerts */}
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
                      isCancel && styles.cancelButton,
                      isDestructive && styles.destructiveButton,
                    ]}
                    onPress={() => {
                      action.onPress();
                      onClose?.();
                    }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && { color: Colors.textSecondary },
                        isDestructive && { color: "#FFFFFF" },
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.foreground,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  destructiveButton: {
    backgroundColor: Colors.destructive,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});