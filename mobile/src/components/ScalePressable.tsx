import React, { ReactNode, useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
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
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;

  // Layout & positioning props go on the outer Pressable
  const {
    flex, width, height, alignSelf,
    position, top, right, bottom, left, zIndex,
    margin, marginTop, marginRight, marginBottom, marginLeft,
    marginHorizontal, marginVertical,
    ...innerStyle
  } = flat || {} as ViewStyle;

  const outerRaw: Record<string, any> = {
    flex, width, height, alignSelf,
    position, top, right, bottom, left, zIndex,
    margin, marginTop, marginRight, marginBottom, marginLeft,
    marginHorizontal, marginVertical,
  };
  // Strip undefined keys so they don't interfere with defaults
  const outerStyle: ViewStyle = Object.fromEntries(
    Object.entries(outerRaw).filter(([, v]) => v !== undefined)
  ) as ViewStyle;

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
      style={outerStyle}
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
      <Animated.View style={[innerStyle, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
