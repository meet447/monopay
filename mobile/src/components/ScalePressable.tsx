import React, { ReactNode, useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

type HapticType = "none" | "light" | "medium";

type Props = Omit<PressableProps, "style"> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticType;
  activeScale?: number;
};

export function ScalePressable({
  children,
  style,
  haptic = "none",
  activeScale = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const triggerScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 26,
      bounciness: 5,
    }).start();
  };

  const triggerHaptic = () => {
    if (haptic === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (haptic === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        triggerScale(activeScale);
        triggerHaptic();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        triggerScale(1);
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
