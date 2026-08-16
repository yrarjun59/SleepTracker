// components/home/HoldToRecordButton.tsx
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  onComplete: () => void;
}

export function HoldToRecordButton({ onComplete }: Props) {
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef<Animated.CompositeAnimation | null>(null);
  const hapticInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFired = useRef(false);

  const { colors } = useTheme();

  const startHold = () => {
    hasFired.current = false;
    setHolding(true);

    // Continuous haptic while holding (every 500ms)
    hapticInterval.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 500);

    progress.setValue(0);

    progressAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: 3000, // 3 seconds
      useNativeDriver: false,
    });
    progressAnim.current.start();

    // Hold for 3 seconds, then complete
    holdTimer.current = setTimeout(() => {
      hasFired.current = true;
      onComplete();
      reset();
    }, 3000);
  };

  const cancelHold = () => {
    if (hasFired.current) return;
    reset();
  };

  const reset = () => {
    // Clear all timers and animations
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (progressAnim.current) {
      progressAnim.current.stop();
      progressAnim.current = null;
    }
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
    setHolding(false);
    progress.setValue(0);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (progressAnim.current) progressAnim.current.stop();
      if (hapticInterval.current) clearInterval(hapticInterval.current);
    };
  }, []);

  const fillHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 90],
  });

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={cancelHold}
      pressRetentionOffset={{ top: 40, bottom: 40, left: 40, right: 40 }}
      style={styles.container}
    >
      <View style={[styles.outerCircle, { borderColor: colors.primary }]}>
        <Animated.View style={[styles.fill, { height: fillHeight }]} />

        <View
          style={[styles.innerCircle, { backgroundColor: colors.primary }]}
        />

        <View style={styles.textLayer}>
          <Text style={styles.mainText}>
            {holding ? "Keep holding..." : "Wake Up"}
          </Text>
          <Text style={styles.subText}>hold 3 sec</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  fill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    opacity: 0.9,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    zIndex: 0,
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: "absolute",
    top: 1,
    left: 1,
    zIndex: 1,
  },
  textLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  mainText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  subText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
  },
});
