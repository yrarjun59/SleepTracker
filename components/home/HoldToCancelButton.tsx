import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Colors } from "@/constants/Colors";

interface Props {
  onComplete: () => void;
  onFinishPress: () => void;
}

export function HoldToCancelButton({ onComplete, onFinishPress }: Props) {
  const [isHolding, setIsHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasCompleted = useRef(false);

  const HOLD_DURATION = 5000;

  const startHold = () => {
    hasCompleted.current = false;
    setIsHolding(true);

    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished && !hasCompleted.current) {
        hasCompleted.current = true;
        onComplete();
        reset();
      }
    });
  };

  const cancelHold = () => {
    if (hasCompleted.current) return;
    if (animationRef.current) {
      animationRef.current.stop();
    }
    reset();
  };

  const reset = () => {
    setIsHolding(false);
    progress.setValue(0);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={cancelHold}
      onPress={() => {
        if (!isHolding && !hasCompleted.current) {
          onFinishPress();
        }
      }}
      style={styles.wrapper}
    >
      <View style={styles.button}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthInterpolated,
              backgroundColor: isHolding ? "#C62828" : "transparent",
            },
          ]}
        />
        <View style={styles.content}>
          <Text style={styles.mainText}>
            {isHolding ? "Hold to Cancel..." : "Record Wakeup"}
          </Text>
          <Text style={styles.hint}>
            {isHolding ? "Keep holding (5s)" : "Hold 5 seconds to abort"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 300,
  },
  button: {
    height: 72,
    borderRadius: 36, // fully rounded pill
    backgroundColor: Colors.primary,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    alignItems: "center",
    zIndex: 2,
  },
  mainText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  hint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 4,
  },
});