import React, { useEffect, useMemo } from "react";
import {
  Alert,
  Animated,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  LucideCheckCircle,
  LucideExternalLink,
  LucideShare2,
  LucideUserPlus,
  LucideZap,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContacts } from "../context/ContactContext";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { LinearGradient } from "expo-linear-gradient";
import { premiumColors, premiumGradients } from "../theme/premium";

export function PaymentSuccessScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { saveContact, getContactName } = useContacts();
  const { recipientHandle, inrAmount, signature } = route.params;

  const successAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 13,
      stiffness: 140,
      mass: 0.8,
    }).start();
  }, [successAnim]);

  const isAlreadySaved =
    getContactName(recipientHandle) !==
    `${recipientHandle.slice(0, 4)}...${recipientHandle.slice(-4)}`;

  const onSaveContact = () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Save Contact",
        "Enter a nickname for this recipient",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: (name?: string) => {
              if (name) saveContact(recipientHandle, name);
            },
          },
        ],
        "plain-text"
      );
      return;
    }

    Alert.alert("Add Contact", "Save this recipient with a default name?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        onPress: () => saveContact(recipientHandle, `Contact ${recipientHandle.slice(0, 4)}`),
      },
    ]);
  };

  const onShare = async () => {
    try {
      const message = `Payment Successful\n\nSent: ₹${inrAmount}\nTo: ${recipientHandle}\nVia: monopay\n\nTransaction ID: ${signature}\nView details: https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      await Share.share({ message, title: "Payment Receipt" });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const viewOnExplorer = () => {
    Linking.openURL(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  };

  return (
    <PremiumBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <View style={styles.content}>
          <Animated.View
            style={{
              opacity: successAnim,
              transform: [
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
            }}
          >
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={[...premiumGradients.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successIconCore}
              >
                <LucideCheckCircle size={52} color={premiumColors.darkText} />
              </LinearGradient>
            </View>
          </Animated.View>

          <Text style={styles.successText}>Payment Complete</Text>
          <Text style={styles.amountText}>₹{inrAmount}</Text>
          <Text style={styles.recipientText}>to {getContactName(recipientHandle)}</Text>

          <GlassCard style={styles.receiptCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transaction ID</Text>
              <Text style={styles.infoValue}>
                {signature.slice(0, 8)}...{signature.slice(-8)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <View style={styles.platformBadge}>
                <LucideZap size={11} color={premiumColors.accent} />
                <Text style={styles.platformText}>monopay</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {!isAlreadySaved ? (
            <ScalePressable style={styles.saveContactButton} onPress={onSaveContact} haptic="light">
              <LucideUserPlus color={premiumColors.accent} size={18} />
              <Text style={styles.saveContactText}>Add to Contacts</Text>
            </ScalePressable>
          ) : null}

          <ScalePressable style={styles.shareWrap} onPress={onShare} haptic="medium">
            <LinearGradient
              colors={[...premiumGradients.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButton}
            >
              <LucideShare2 color={premiumColors.darkText} size={18} />
              <Text style={styles.shareButtonText}>Share Receipt</Text>
            </LinearGradient>
          </ScalePressable>

          <ScalePressable style={styles.explorerButton} onPress={viewOnExplorer} haptic="light">
            <LucideExternalLink color={premiumColors.textSecondary} size={15} />
            <Text style={styles.explorerButtonText}>View on Solana Explorer</Text>
          </ScalePressable>

          <ScalePressable style={styles.doneButton} onPress={() => navigation.popToTop()} haptic="light">
            <Text style={styles.doneButtonText}>Done</Text>
          </ScalePressable>
        </View>
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successIconCore: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    color: premiumColors.accent,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  amountText: {
    color: premiumColors.textPrimary,
    fontSize: 56,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -1,
  },
  recipientText: {
    color: premiumColors.textSecondary,
    fontSize: 16,
    marginBottom: 26,
  },
  receiptCard: {
    width: "100%",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    color: premiumColors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: premiumColors.textPrimary,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(224, 120, 80, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  platformText: {
    color: premiumColors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  saveContactButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveContactText: {
    color: premiumColors.accent,
    fontSize: 15,
    fontWeight: "700",
  },
  shareWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  shareButton: {
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  shareButtonText: {
    color: premiumColors.darkText,
    fontSize: 16,
    fontWeight: "800",
  },
  explorerButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
  },
  explorerButtonText: {
    color: premiumColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  doneButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  doneButtonText: {
    color: premiumColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
