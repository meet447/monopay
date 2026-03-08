import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  LucideChevronLeft,
  LucideDelete,
  LucideShieldCheck,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePin } from "../context/PinContext";
import { useWallet } from "../context/WalletContext";
import { runUpiLikePayFlow } from "../features/pay/payController";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { premiumColors, premiumGradients } from "../theme/premium";

export function TransactionPinScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { recipientHandle, recipientWallet, inrAmount } = route.params;
  const { verify } = usePin();
  const { getActiveKeypair, refreshBalance } = useWallet() as any;

  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  const handleKeyPress = (value: string) => {
    if (isProcessing) return;
    if (pin.length < 6) {
      setPin((prev) => prev + value);
    }
  };

  const handleDelete = () => {
    if (isProcessing) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPin = async () => {
    if (pin.length < 4 || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatus("Verifying PIN...");

    try {
      const isPinCorrect = await verify(pin);
      if (!isPinCorrect) {
        Alert.alert("Error", "Incorrect monopay PIN");
        setPin("");
        return;
      }

      setStatus("Signing payment...");
      const keypair = await getActiveKeypair();
      if (!keypair) throw new Error("Failed to retrieve account keys");

      const result = await runUpiLikePayFlow({
        recipientWallet,
        inrAmount,
        senderKeypair: keypair,
      });

      if (result.ok) {
        await refreshBalance();
        navigation.navigate("PaymentSuccess", {
          recipientHandle,
          inrAmount,
          signature: result.signature,
        });
      } else {
        Alert.alert("Failed", result.message);
        setPin("");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setPin("");
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  return (
    <PremiumBackground>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}> 
        <View style={styles.header}>
          <ScalePressable onPress={() => navigation.goBack()} style={styles.backBtn} haptic="light">
            <LucideChevronLeft color={premiumColors.textPrimary} size={22} />
          </ScalePressable>
          <Text style={styles.headerTitle}>Authorize Payment</Text>
        </View>

        <View style={styles.content}>
          <GlassCard style={styles.txInfo}>
            <Text style={styles.recipientText}>Sending to {recipientHandle}</Text>
            <Text style={styles.amountText}>₹{inrAmount}</Text>
          </GlassCard>

          <View style={styles.pinDisplay}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={[styles.dot, pin.length > index && styles.dotActive]} />
            ))}
          </View>

          {isProcessing ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={premiumColors.accent} />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : (
            <Text style={styles.helperText}>Enter your secure PIN</Text>
          )}

          <View style={styles.keypad}>
            <View style={styles.keyRow}>
              {[1, 2, 3].map((num) => (
                <ScalePressable key={num} style={styles.key} onPress={() => handleKeyPress(num.toString())} haptic="light">
                  <Text style={styles.keyText}>{num}</Text>
                </ScalePressable>
              ))}
            </View>
            <View style={styles.keyRow}>
              {[4, 5, 6].map((num) => (
                <ScalePressable key={num} style={styles.key} onPress={() => handleKeyPress(num.toString())} haptic="light">
                  <Text style={styles.keyText}>{num}</Text>
                </ScalePressable>
              ))}
            </View>
            <View style={styles.keyRow}>
              {[7, 8, 9].map((num) => (
                <ScalePressable key={num} style={styles.key} onPress={() => handleKeyPress(num.toString())} haptic="light">
                  <Text style={styles.keyText}>{num}</Text>
                </ScalePressable>
              ))}
            </View>
            <View style={styles.keyRow}>
              <View style={styles.key} />
              <ScalePressable style={styles.key} onPress={() => handleKeyPress("0")} haptic="light">
                <Text style={styles.keyText}>0</Text>
              </ScalePressable>
              <ScalePressable style={styles.key} onPress={handleDelete} haptic="light">
                <LucideDelete color={premiumColors.textPrimary} size={24} />
              </ScalePressable>
            </View>
          </View>

          <ScalePressable
            onPress={submitPin}
            disabled={pin.length < 4 || isProcessing}
            style={[styles.confirmWrap, (pin.length < 4 || isProcessing) && styles.confirmWrapDisabled]}
            haptic="medium"
          >
            <LinearGradient
              colors={[...premiumGradients.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>Confirm Payment</Text>
            </LinearGradient>
          </ScalePressable>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <LucideShieldCheck color={premiumColors.textMuted} size={14} />
            <Text style={styles.footerText}>Securely signed by monopay</Text>
          </View>
        </View>
      </View>
    </PremiumBackground>
  );
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const KEYPAD_PADDING = 20 * 2; // container horizontal padding
const KEY_GAP = 12;
const KEY_WIDTH = (SCREEN_WIDTH - KEYPAD_PADDING - KEY_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    color: premiumColors.textPrimary,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    alignItems: "center",
  },
  txInfo: {
    width: "100%",
    alignItems: "center",
    marginBottom: 28,
    paddingVertical: 20,
  },
  recipientText: {
    color: premiumColors.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  amountText: {
    color: premiumColors.textPrimary,
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  pinDisplay: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: premiumColors.accent,
    borderColor: premiumColors.accent,
  },
  loaderContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  statusText: {
    color: premiumColors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  helperText: {
    color: premiumColors.textMuted,
    fontSize: 13,
  },
  keypad: {
    marginTop: 22,
    width: "100%",
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  key: {
    width: KEY_WIDTH,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    color: premiumColors.textPrimary,
    fontSize: 28,
    fontWeight: "600",
  },
  confirmWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 6,
  },
  confirmWrapDisabled: {
    opacity: 0.5,
  },
  confirmButton: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmText: {
    color: premiumColors.darkText,
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    marginTop: 14,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: premiumColors.textMuted,
    fontSize: 12,
  },
});
