import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { premiumColors, premiumShadow } from "../theme/premium";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GlassCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: premiumColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: premiumColors.border,
    padding: 18,
    ...premiumShadow,
  },
});
