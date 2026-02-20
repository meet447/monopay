import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { LucideCheckCircle, LucideX } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { nfcService } from "../services/NFCService";
import { useWallet } from "../context/WalletContext";
import { runUpiLikePayFlow, PayInput } from "../features/pay/payController";
import { API_BASE_URL } from "../config";
import { ApiClient } from "../api/client";
import { ScalePressable } from "./ScalePressable";
import { premiumColors, premiumGradients } from "../theme/premium";

export function CustomerTapListener({ children }: any) {
  const navigation = useNavigation<any>();
  const [nfcPayload, setNfcPayload] = useState<any>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getActiveKeypair, publicKey } = useWallet() as any;

  const client = useMemo(() => new ApiClient({ baseUrl: API_BASE_URL }), []);

  useEffect(() => {
    nfcService.startListening((payload) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const data = JSON.parse(payload);
        if (data.merchantWalletAddress && data.amount) {
          setNfcPayload(data);
          setShowSheet(true);
        }
      } catch (e) {
        console.warn("Invalid NFC payload", e);
      }
    });

    return () => {
      nfcService.stopListening();
    };
  }, []);

  const closeSheet = () => {
    if (isProcessing) return;
    setShowSheet(false);
    setNfcPayload(null);
  };

  const handleConfirmPay = async () => {
    if (!nfcPayload || !publicKey) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    try {
      const senderKeypair = await getActiveKeypair();
      if (!senderKeypair) throw new Error("Wallet not unlocked");

      const input: PayInput = {
        recipientHandle: nfcPayload.label || "NFC Tap",
        recipientWallet: nfcPayload.merchantWalletAddress,
        inrAmount: parseFloat(nfcPayload.amount),
        pin: "dummy_not_used",
        senderKeypair,
      };

      const response = await runUpiLikePayFlow(client, input);

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSheet(false);
        setNfcPayload(null);
        navigation.navigate("PaymentSuccess", {
          recipientHandle: nfcPayload.label || "Merchant",
          inrAmount: nfcPayload.amount,
          signature: response.signature,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.warn("Payment failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View style={styles.sheetOverlay}>
          <ScalePressable style={styles.backdrop} onPress={closeSheet} />

          <View style={styles.sheetContent}>
            <ScalePressable style={styles.closeBtn} onPress={closeSheet} haptic="light">
              <LucideX color={premiumColors.textPrimary} size={22} />
            </ScalePressable>

            <View style={styles.sheetHeader}>
              <View style={styles.merchantIcon}>
                <Text style={styles.merchantIconText}>
                  {nfcPayload?.label?.[0]?.toUpperCase() || "M"}
                </Text>
              </View>
              <Text style={styles.merchantTitle}>Paying {nfcPayload?.label || "Merchant"}</Text>
              <Text style={styles.merchantSubtitle}>Tap-to-pay request detected</Text>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>₹{nfcPayload?.amount || "0"}</Text>
              <Text style={styles.tokenText}>via Solana {nfcPayload?.token || "USDC"}</Text>
            </View>

            <ScalePressable
              style={[styles.payWrap, isProcessing && styles.payButtonDisabled]}
              onPress={handleConfirmPay}
              disabled={isProcessing}
              haptic="medium"
            >
              <LinearGradient
                colors={[...premiumGradients.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButton}
              >
                {isProcessing ? (
                  <ActivityIndicator color={premiumColors.darkText} />
                ) : (
                  <>
                    <LucideCheckCircle color={premiumColors.darkText} size={18} />
                    <Text style={styles.payButtonText}>Confirm & Pay</Text>
                  </>
                )}
              </LinearGradient>
            </ScalePressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 8, 15, 0.7)",
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(7, 20, 36, 0.98)",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetHeader: {
    alignItems: "center",
    marginBottom: 26,
    marginTop: 8,
  },
  merchantIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: premiumColors.accentSoft,
    borderWidth: 1,
    borderColor: premiumColors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  merchantIconText: {
    fontSize: 24,
    fontWeight: "900",
    color: premiumColors.accent,
  },
  merchantTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: premiumColors.textPrimary,
    textAlign: "center",
  },
  merchantSubtitle: {
    fontSize: 13,
    color: premiumColors.textSecondary,
    marginTop: 3,
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    width: "100%",
    paddingVertical: 20,
  },
  amountText: {
    fontSize: 46,
    fontWeight: "800",
    color: premiumColors.textPrimary,
    letterSpacing: -0.8,
  },
  tokenText: {
    fontSize: 13,
    color: premiumColors.textSecondary,
    marginTop: 6,
  },
  payWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  payButton: {
    width: "100%",
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: premiumColors.darkText,
  },
});
