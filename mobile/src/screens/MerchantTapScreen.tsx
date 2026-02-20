import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LucideWifi, LucideX } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nfcService } from "../services/NFCService";
import { useWallet } from "../context/WalletContext";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { premiumColors, premiumGradients } from "../theme/premium";

export function MerchantTapScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { publicKey } = useWallet() as any;
  const { amount } = route.params || { amount: "0" };

  const [isNfcActive, setIsNfcActive] = useState(false);
  const [statusText, setStatusText] = useState("Initializing NFC...");

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    startNfcBroadcasting();

    return () => {
      loop.stop();
      nfcService.stopListening();
    };
  }, []);

  const startNfcBroadcasting = async () => {
    try {
      if (!publicKey) return;

      setIsNfcActive(true);
      setStatusText("Ready to tap...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const payload = JSON.stringify({
        merchantWalletAddress: publicKey.toBase58(),
        amount,
        token: "USDC",
        label: "SolUPI Payment",
        timestamp: Date.now(),
      });

      const success = await nfcService.writeNdef(payload);
      if (success) {
        setStatusText("Tap received");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => navigation.goBack(), 320);
      } else {
        setStatusText("Waiting for nearby device...");
      }
    } catch (e) {
      setStatusText("NFC unavailable");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.warn("NFC Broadcast Error:", e);
    } finally {
      setIsNfcActive(false);
    }
  };

  const pulseScaleLarge = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const pulseScaleSmall = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0.48, 0.12, 0],
  });

  return (
    <PremiumBackground>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <ScalePressable onPress={() => navigation.goBack()} style={styles.closeBtn} haptic="light">
            <LucideX color={premiumColors.textPrimary} size={24} />
          </ScalePressable>
          <Text style={styles.headerTitle}>Tap to Receive</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.amountText}>₹{amount || "0"}</Text>
          <Text style={styles.instructionText}>
            Hold your device near the customer phone to receive payment instantly.
          </Text>

          <View style={styles.radarContainer}>
            <Animated.View
              style={[
                styles.radarPulse,
                { transform: [{ scale: pulseScaleLarge }], opacity: pulseOpacity },
              ]}
            />
            <Animated.View
              style={[
                styles.radarPulse,
                {
                  transform: [{ scale: pulseScaleSmall }],
                  opacity: pulseOpacity,
                },
              ]}
            />

            <LinearGradient
              colors={[...premiumGradients.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nfcIconContainer}
            >
              <LucideWifi color={premiumColors.darkText} size={42} />
            </LinearGradient>
          </View>

          <GlassCard style={styles.statusCard}>
            <Text style={[styles.statusText, isNfcActive && styles.statusTextActive]}>{statusText}</Text>
          </GlassCard>
        </View>
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: premiumColors.textPrimary,
    letterSpacing: -0.6,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: {
    color: premiumColors.textPrimary,
    fontSize: 56,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -1,
  },
  instructionText: {
    color: premiumColors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 48,
    paddingHorizontal: 14,
  },
  radarContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 220,
    height: 220,
    marginBottom: 40,
  },
  radarPulse: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(224, 120, 80, 0.45)",
  },
  nfcIconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(4, 12, 22, 0.8)",
  },
  statusCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statusText: {
    color: premiumColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  statusTextActive: {
    color: premiumColors.accent,
  },
});
