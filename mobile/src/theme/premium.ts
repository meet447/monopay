import { Platform } from "react-native";

export const premiumColors = {
  bgTop: "#242424", // Lighter shade of surge dark for gradient start
  bgMid: "#1f1f1f", // Mid shade
  bgBottom: "#1a1a1a", // var(--color-surge-dark)
  surface: "rgba(255, 255, 255, 0.08)",
  surfaceStrong: "rgba(255, 255, 255, 0.14)",
  surfaceSoft: "rgba(255, 255, 255, 0.05)",
  border: "rgba(245, 245, 245, 0.22)", // Based on surge-gray
  borderSoft: "rgba(245, 245, 245, 0.14)",
  textPrimary: "#f5f5f5", // var(--color-surge-gray)
  textSecondary: "rgba(245, 245, 245, 0.7)",
  textMuted: "rgba(245, 245, 245, 0.5)",
  accent: "#e07850", // var(--color-surge-orange)
  accentStrong: "#d56840", // var(--color-surge-orange-dark)
  accentSoft: "rgba(224, 120, 80, 0.2)",
  danger: "#FF7A8A",
  success: "#e07850", // Using surge orange for success actions to keep theme consistent, or a complementary green
  darkText: "#1a1a1a", // Using surge dark for text on top of accents
};

export const premiumGradients = {
  screen: [premiumColors.bgTop, premiumColors.bgMid, premiumColors.bgBottom] as const,
  card: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"] as const,
  accent: [premiumColors.accent, premiumColors.accentStrong] as const,
  subtleAccent: ["rgba(224, 120, 80, 0.2)", "rgba(224, 120, 80, 0.05)"] as const,
};

export const premiumShadow = Platform.select({
  ios: {
    shadowColor: "#02060D",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  android: {
    elevation: 10,
  },
  default: {},
});
