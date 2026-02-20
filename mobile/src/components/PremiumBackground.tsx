import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { premiumColors, premiumGradients } from "../theme/premium";

type Props = {
  children: ReactNode;
};

export function PremiumBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...premiumGradients.screen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowOrb, styles.glowLeft]} />
      <View style={[styles.glowOrb, styles.glowRight]} />
      <View style={[styles.glowOrb, styles.glowBottom]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumColors.bgBottom,
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.35,
  },
  glowLeft: {
    top: -120,
    left: -90,
    width: 240,
    height: 240,
    backgroundColor: "rgba(94, 169, 255, 0.3)",
  },
  glowRight: {
    top: 130,
    right: -80,
    width: 220,
    height: 220,
    backgroundColor: "rgba(224, 120, 80, 0.22)",
    filter: "blur(90px)",
  },
  glowBottom: {
    bottom: -110,
    alignSelf: "center",
    width: 300,
    height: 300,
    backgroundColor: "rgba(63, 114, 198, 0.18)",
  },
});
