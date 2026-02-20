import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  LucideChevronDown,
  LucideChevronLeft,
  LucideShieldCheck,
  LucideWallet,
  LucideWifi,
  LucideX,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../context/WalletContext";
import { useQuote } from "../hooks/useQuote";
import { ApiClient } from "../api/client";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { premiumColors, premiumGradients } from "../theme/premium";

type Props = {
  apiBaseUrl: string;
  userId: string;
  navigation: any;
  route: any;
};

export function PayScreen({ apiBaseUrl, navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { publicKey, allWallets, switchWallet } = useWallet() as any;

  const [handle, setHandle] = useState(route?.params?.qrData || "");
  const [resolvedName, setResolvedName] = useState("");
  const [recipientWallet, setRecipientWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const revealAnim = useMemo(() => new Animated.Value(0), []);
  const walletSheetAnim = useMemo(() => new Animated.Value(80), []);

  useEffect(() => {
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [revealAnim]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!handle || handle.length < 3) {
        setResolvedName("");
        setRecipientWallet(null);
        setIsVerified(false);
        return;
      }

      setIsResolving(true);
      try {
        const client = new ApiClient({ baseUrl: apiBaseUrl });
        const res = await client.resolveHandle(handle);
        setResolvedName(res.handle);
        setRecipientWallet(res.wallet);
        setIsVerified(true);
      } catch {
        setResolvedName("Unknown User");
        setRecipientWallet(null);
        setIsVerified(false);
      } finally {
        setIsResolving(false);
      }
    }, 420);

    return () => clearTimeout(timer);
  }, [apiBaseUrl, handle]);

  useEffect(() => {
    if (!route?.params?.qrData) return;

    let resolvedHandle = route.params.qrData;
    if (resolvedHandle.startsWith("solana:")) {
      resolvedHandle = resolvedHandle.split(":")[1].split("?")[0];
    }
    setHandle(resolvedHandle);
  }, [route?.params?.qrData]);

  const { quote, isLoading: isQuoteLoading } = useQuote(amount);

  const openWalletPicker = () => {
    setShowWalletPicker(true);
    Animated.timing(walletSheetAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeWalletPicker = () => {
    Animated.timing(walletSheetAnim, {
      toValue: 80,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowWalletPicker(false));
  };

  const onPayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isVerified || !recipientWallet) {
      Alert.alert("Error", "Please enter a valid monopay handle");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    navigation.navigate("TransactionPin", {
      recipientHandle: handle,
      recipientWallet,
      inrAmount: parseFloat(amount),
      solAmount: quote?.sol,
    });
  };

  if (!publicKey) return null;

  const activeWallet =
    allWallets.find((wallet: any) => wallet.address === publicKey.toBase58())?.handle ||
    `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;

  return (
    <PremiumBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: revealAnim,
              transform: [
                {
                  translateY: revealAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.header}>
              <ScalePressable onPress={() => navigation.goBack()} style={styles.backBtn} haptic="light">
                <LucideChevronLeft color={premiumColors.textPrimary} size={22} />
              </ScalePressable>
              <Text style={styles.headerTitle}>Send Money</Text>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 220 }]}
            >
              <GlassCard style={styles.recipientCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {isResolving
                      ? ".."
                      : (handle && handle.length > 1
                        ? (handle.startsWith("@") ? handle.substring(1, 3) : handle.substring(0, 2))
                        : "?")
                        .toUpperCase()}
                  </Text>
                  {isVerified ? (
                    <View style={styles.verifiedBadge}>
                      <LucideShieldCheck color={premiumColors.darkText} size={10} />
                    </View>
                  ) : null}
                </View>

                <TextInput
                  style={styles.handleInput}
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="Enter handle (e.g. alice)"
                  placeholderTextColor={premiumColors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={[styles.recipientHandle, isVerified && styles.verifiedText]}>
                  {isResolving
                    ? "Verifying handle..."
                    : handle.length > 0
                      ? isVerified
                        ? `Verified: ${resolvedName}`
                        : resolvedName
                      : "Enter a monopay handle to continue"}
                </Text>
              </GlassCard>

              <GlassCard style={styles.amountContainer}>
                <View style={styles.amountInputRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.hugeAmountInput}
                    value={amount}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={premiumColors.textMuted}
                    autoFocus
                  />
                </View>

                {quote ? (
                  <View style={styles.quotePill}>
                    <Text style={styles.quotePillText}>≈ {quote.sol} SOL</Text>
                  </View>
                ) : null}
              </GlassCard>

              <TextInput
                style={styles.messageInput}
                placeholder="Add a note (optional)"
                placeholderTextColor={premiumColors.textMuted}
              />
            </ScrollView>
          </Animated.View>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <ScalePressable
              style={styles.walletSelectorCompact}
              onPress={openWalletPicker}
              haptic="light"
            >
              <View style={styles.bankIcon}>
                <LucideWallet color={premiumColors.accent} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletNameCompact}>{activeWallet}</Text>
                <Text style={styles.walletAddrCompact}>
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </Text>
              </View>
              <LucideChevronDown color={premiumColors.textSecondary} size={18} />
            </ScalePressable>

            <ScalePressable
              onPress={onPayPress}
              disabled={!amount || isQuoteLoading}
              haptic="medium"
              style={[styles.payButtonWrap, (!amount || isQuoteLoading) && styles.disabledButton]}
            >
              <LinearGradient
                colors={[...premiumGradients.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonMain}
              >
                <Text style={styles.payButtonTextMain}>Pay ₹{amount || "0"}</Text>
              </LinearGradient>
            </ScalePressable>

            <ScalePressable
              style={styles.tapToPayButton}
              onPress={() => navigation.navigate("MerchantTap", { amount })}
              haptic="light"
            >
              <LucideWifi color={premiumColors.accent} size={18} />
              <Text style={styles.tapToPayText}>Receive via Tap</Text>
            </ScalePressable>
          </View>
        </KeyboardAvoidingView>

        {showWalletPicker ? (
          <View style={styles.modalOverlay}>
            <ScalePressable style={styles.modalBackdrop} onPress={closeWalletPicker} />
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: walletSheetAnim }],
                },
              ]}
            >
              <ScalePressable style={styles.closeModal} onPress={closeWalletPicker} haptic="light">
                <LucideX color={premiumColors.textPrimary} size={20} />
              </ScalePressable>
              <Text style={styles.modalTitle}>Choose Account</Text>
              {allWallets.map((wallet: any) => (
                <ScalePressable
                  key={wallet.address}
                  style={[
                    styles.walletItem,
                    publicKey.toBase58() === wallet.address && styles.activeWalletItem,
                  ]}
                  onPress={() => {
                    switchWallet(wallet.address);
                    closeWalletPicker();
                  }}
                  haptic="medium"
                >
                  <Text style={styles.walletLabel}>{wallet.handle || wallet.label}</Text>
                  <Text style={styles.walletSubAddr}>
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                  </Text>
                </ScalePressable>
              ))}
            </Animated.View>
          </View>
        ) : null}
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: {
    color: premiumColors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  recipientCard: {
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(224, 120, 80, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(224, 120, 80, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: premiumColors.accent,
    fontSize: 22,
    fontWeight: "800",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: premiumColors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: premiumColors.bgBottom,
  },
  handleInput: {
    color: premiumColors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    paddingVertical: 4,
  },
  recipientHandle: {
    color: premiumColors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  verifiedText: {
    color: premiumColors.accent,
  },
  amountContainer: {
    borderRadius: 26,
    alignItems: "center",
    paddingVertical: 22,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    color: premiumColors.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    marginRight: 6,
  },
  hugeAmountInput: {
    color: premiumColors.textPrimary,
    fontSize: 62,
    fontWeight: "800",
    minWidth: 110,
    textAlign: "center",
  },
  quotePill: {
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quotePillText: {
    color: premiumColors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  messageInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    color: premiumColors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
  },
  bottomBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(8, 20, 35, 0.95)",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  walletSelectorCompact: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },
  bankIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(224, 120, 80, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  walletNameCompact: {
    color: premiumColors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  walletAddrCompact: {
    color: premiumColors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  payButtonWrap: {
    borderRadius: 18,
    overflow: "hidden",
  },
  payButtonMain: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  payButtonTextMain: {
    color: premiumColors.darkText,
    fontSize: 17,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.55,
  },
  tapToPayButton: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(224, 120, 80, 0.12)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
  },
  tapToPayText: {
    color: premiumColors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 8, 15, 0.74)",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(7, 20, 35, 0.98)",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  closeModal: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    color: premiumColors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
  },
  walletItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  activeWalletItem: {
    borderColor: premiumColors.accent,
    backgroundColor: "rgba(224, 120, 80, 0.16)",
  },
  walletLabel: {
    color: premiumColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  walletSubAddr: {
    color: premiumColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
