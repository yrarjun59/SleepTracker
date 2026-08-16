import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const CONFIRM_TEXT = "DELETE";

export function ConfirmClearDataModal({ visible, onCancel, onConfirm }: Props) {
  const { colors } = useTheme();
  const [input, setInput] = useState("");

  const isConfirmed = input.trim() === CONFIRM_TEXT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Clear All Data
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            This will permanently delete all sleep records (local and cloud).
            Type{" "}
            <Text style={{ fontWeight: "700", color: colors.destructive }}>
              {CONFIRM_TEXT}
            </Text>{" "}
            to confirm.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder={CONFIRM_TEXT}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancel,
                { borderColor: colors.border },
              ]}
              onPress={onCancel}
            >
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.destructive,
                {
                  backgroundColor: isConfirmed
                    ? colors.destructive
                    : colors.muted,
                },
              ]}
              disabled={!isConfirmed}
              onPress={onConfirm}
            >
              <Text
                style={{ color: isConfirmed ? "#fff" : colors.textSecondary }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    borderWidth: 1,
  },
  destructive: {},
});
