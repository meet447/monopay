import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  LucideArrowDownLeft,
  LucideArrowUpRight,
  LucideCopy,
  LucideScan,
  LucideSettings,
  LucideUsers,
  LucideWallet,
  LucideX,
  LucideZap,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../context/WalletContext";
import { useContacts } from "../context/ContactContext";
import { QRScanner } from "../components/QRScanner";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { premiumColors } from "../theme/premium";

const sheetStart = Dimensions.get("window").height;

export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    publicKey,
    disconnect,
    allWallets,
    switchWallet,
    balance,
    solPrice,
    refreshBalance,
    transactions,
    isLoadingTransactions,
  } = useWallet() as any;
  const { frequentPayees, getContactName } = useContacts();

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [amount, setAmount] = useState("");

  const screenAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnimReceive = useMemo(() => new Animated.Value(sheetStart), []);
  const slideAnimWallet = useMemo(() => new Animated.Value(sheetStart), []);

  useEffect(() => {
    Animated.timing(screenAnim, {
      toValue: 1,
      duration: 580,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenAnim]);

  const activeWallet = useMemo(
    () => allWallets.find((wallet: any) => wallet.address === publicKey?.toBase58()),
    [allWallets, publicKey]
  );

  const solanaPayUri = useMemo(() => {
    if (!publicKey) return "";
    // Prefer the monopay handle so the scanner resolves it as a handle, not a raw address
    if (activeWallet?.handle) {
      const handlePart = activeWallet.handle.replace("@monopay.app", "").replace(/^@/, "");
      return amount ? `monopay:${handlePart}?amount=${amount}` : `monopay:${handlePart}`;
    }
    return `solana:${publicKey.toBase58()}?amount=${amount || 0}&label=monopay`;
  }, [publicKey, activeWallet, amount]);

  const openModal = (type: "receive" | "wallet") => {
    if (type === "receive") {
      setShowReceiveModal(true);
      Animated.timing(slideAnimReceive, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    setShowWalletModal(true);
    Animated.timing(slideAnimWallet, {
      toValue: 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = (type: "receive" | "wallet") => {
    if (type === "receive") {
      Animated.timing(slideAnimReceive, {
        toValue: sheetStart,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowReceiveModal(false));
      return;
    }

    Animated.timing(slideAnimWallet, {
      toValue: sheetStart,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowWalletModal(false));
  };

  const onScan = (data: string) => {
    setIsScannerVisible(false);
    navigation.navigate("Pay", { qrData: data });
  };

  const copyAddress = async () => {
    if (!publicKey) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(publicKey.toBase58());
    Alert.alert("Copied", "Address copied to clipboard.");
  };

  const requestAirdrop = async () => {
    if (!publicKey) return;
    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      await refreshBalance();
      Alert.alert("Success", "1 SOL dropped into your account.");
    } catch (e) {
      Alert.alert(
        "Faucet Busy",
        "The public Solana faucet is rate-limited. Use https://faucet.solana.com (Devnet). Address copied.",
        [
          {
            text: "OK",
            onPress: async () => {
              if (publicKey) {
                await Clipboard.setStringAsync(publicKey.toBase58());
              }
            },
          },
        ]
      );
    }
  };

  const formatTx = (tx: any) => {
    const time = tx.time
      ? new Date(tx.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "Pending";
    const date = tx.time
      ? new Date(tx.time * 1000).toLocaleDateString([], { month: "short", day: "numeric" })
      : "";

    const instructions = tx.details?.transaction?.message?.instructions;
    const transferIx = instructions?.find(
      (ix: any) => ix.program === "system" && ix.parsed?.type === "transfer"
    );

    if (transferIx) {
      const info = transferIx.parsed.info;
      const isSent = info.source === publicKey.toBase58();
      const amountSol = info.lamports / LAMPORTS_PER_SOL;
      const amountInr = (amountSol * solPrice).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      });

      return {
        label: isSent
          ? `Sent to ${getContactName(info.destination)}`
          : `Received from ${getContactName(info.source)}`,
        subLabel: `${date}, ${time}`,
        amount: `${isSent ? "-" : "+"} ₹${amountInr}`,
        isSent,
        sol: `${amountSol.toFixed(4)} SOL`,
      };
    }

    return {
      label: "Other Transaction",
      subLabel: `${date}, ${time}`,
      amount: "---",
      isSent: false,
      sol: tx.signature.slice(0, 8) + "...",
    };
  };

  if (!publicKey) return null;

  return (
    <PremiumBackground>
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: screenAnim,
              transform: [
                {
                  translateY: screenAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <ScalePressable style={styles.walletSelector} onPress={() => openModal("wallet")} haptic="light">
              <View style={styles.walletIconWrap}>
                <LucideWallet color={premiumColors.accent} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Active Account</Text>
                <Text style={styles.walletAddr} numberOfLines={1}>
                  {activeWallet?.handle || `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`}
                </Text>
              </View>
              <LucideUsers color={premiumColors.textSecondary} size={18} />
            </ScalePressable>

            <ScalePressable
              onPress={() => disconnect()}
              style={styles.settingsBtn}
              haptic="light"
            >
              <LucideSettings color={premiumColors.textSecondary} size={20} />
            </ScalePressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          >
            <LinearGradient
              colors={["rgba(213, 104, 64, 0.25)", "rgba(224, 120, 80, 0.08)", "rgba(255,255,255,0.04)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                {balance !== null
                  ? `₹${(balance * solPrice).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}`
                  : "₹0.00"}
              </Text>
              <View style={styles.balanceFooter}>
                <Text style={styles.balanceSub}>{balance !== null ? `${balance.toFixed(4)} SOL` : "0.0000 SOL"}</Text>
                {balance === 0 ? (
                  <ScalePressable onPress={requestAirdrop} haptic="light">
                    <Text style={styles.balanceLink}>Request Test SOL</Text>
                  </ScalePressable>
                ) : null}
              </View>
            </LinearGradient>

            {frequentPayees.length > 0 ? (
              <View style={styles.contactsSection}>
                <Text style={styles.sectionLabel}>Quick Pay</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.contactsScroll}
                >
                  {frequentPayees.map((contact) => (
                    <ScalePressable
                      key={contact.address}
                      style={styles.contactItem}
                      onPress={() => navigation.navigate("Pay", { qrData: contact.address })}
                      haptic="light"
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>{contact.name.substring(0, 1).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                    </ScalePressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.quickActions}>
              <ScalePressable
                style={styles.actionItem}
                onPress={() => setIsScannerVisible(true)}
                haptic="medium"
              >
                <View style={[styles.iconCircle, styles.iconPrimary]}>
                  <LucideScan color={premiumColors.darkText} size={24} />
                </View>
                <Text style={styles.actionText}>Scan</Text>
              </ScalePressable>

              <ScalePressable style={styles.actionItem} onPress={() => openModal("receive")} haptic="light">
                <View style={styles.iconCircle}>
                  <LucideArrowDownLeft color={premiumColors.accent} size={24} />
                </View>
                <Text style={styles.actionText}>Receive</Text>
              </ScalePressable>

              <ScalePressable
                style={styles.actionItem}
                onPress={() => navigation.navigate("Pay")}
                haptic="light"
              >
                <View style={styles.iconCircle}>
                  <LucideArrowUpRight color={premiumColors.textPrimary} size={24} />
                </View>
                <Text style={styles.actionText}>Send</Text>
              </ScalePressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {isLoadingTransactions && transactions.length === 0 ? (
                <ActivityIndicator color={premiumColors.accent} style={{ marginTop: 20 }} />
              ) : transactions.length === 0 ? (
                <Text style={styles.emptyText}>No transactions yet.</Text>
              ) : (
                transactions.map((tx: any) => {
                  const formatted = formatTx(tx);
                  return (
                    <GlassCard key={tx.signature} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <LucideZap
                          color={formatted.isSent ? premiumColors.danger : premiumColors.success}
                          size={16}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityName}>{formatted.label}</Text>
                        <Text style={styles.activityDate}>{formatted.subLabel}</Text>
                      </View>
                      <View style={styles.activityRight}>
                        <Text
                          style={[
                            styles.activityAmount,
                            { color: formatted.isSent ? premiumColors.textPrimary : premiumColors.accent },
                          ]}
                        >
                          {formatted.amount}
                        </Text>
                        <Text style={styles.activitySol}>{formatted.sol}</Text>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </View>
          </ScrollView>
        </Animated.View>

        {showReceiveModal ? (
          <View style={styles.modalOverlay}>
            <ScalePressable style={styles.modalBackdrop} onPress={() => closeModal("receive")} />
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnimReceive }] }]}>
              <ScalePressable style={styles.closeModal} onPress={() => closeModal("receive")} haptic="light">
                <LucideX color={premiumColors.textSecondary} size={22} />
              </ScalePressable>

              <Text style={styles.modalTitle}>Receive with QR</Text>
              <Text style={styles.modalSubtitle}>Share this code to receive payment securely.</Text>

              <View style={styles.qrContainer}>
                {solanaPayUri ? (
                  <QRCode value={solanaPayUri} size={190} color="#102032" backgroundColor="#FFFFFF" />
                ) : (
                  <View style={{ width: 190, height: 190, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: premiumColors.textMuted }}>Loading...</Text>
                  </View>
                )}
              </View>

              <View style={styles.amountToggle}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Set amount (optional)"
                  placeholderTextColor={premiumColors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.amountCurrency}>INR</Text>
              </View>

              <ScalePressable style={styles.copyButton} onPress={copyAddress} haptic="light">
                <LucideCopy color={premiumColors.accent} size={16} />
                <Text style={styles.copyText}>Copy Address</Text>
              </ScalePressable>
            </Animated.View>
          </View>
        ) : null}

        {showWalletModal ? (
          <View style={styles.modalOverlay}>
            <ScalePressable style={styles.modalBackdrop} onPress={() => closeModal("wallet")} />
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnimWallet }] }]}>
              <ScalePressable style={styles.closeModal} onPress={() => closeModal("wallet")} haptic="light">
                <LucideX color={premiumColors.textSecondary} size={22} />
              </ScalePressable>

              <Text style={styles.modalTitle}>Switch Account</Text>
              <ScrollView style={styles.walletList} showsVerticalScrollIndicator={false}>
                {allWallets.map((wallet: any) => (
                  <ScalePressable
                    key={wallet.address}
                    style={[
                      styles.walletItem,
                      publicKey.toBase58() === wallet.address && styles.activeWalletItem,
                    ]}
                    onPress={() => {
                      switchWallet(wallet.address);
                      closeModal("wallet");
                    }}
                    haptic="medium"
                  >
                    <Text style={styles.walletLabel}>{wallet.handle || wallet.label}</Text>
                    <Text style={styles.walletSubAddr}>
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                    </Text>
                  </ScalePressable>
                ))}
              </ScrollView>

              <ScalePressable
                style={styles.addWalletBtn}
                onPress={() => {
                  closeModal("wallet");
                  setTimeout(() => disconnect(), 260);
                }}
                haptic="light"
              >
                <Text style={styles.addWalletText}>+ Link New Account</Text>
              </ScalePressable>
            </Animated.View>
          </View>
        ) : null}

        <QRScanner visible={isScannerVisible} onClose={() => setIsScannerVisible(false)} onScan={onScan} />
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  walletSelector: {
    flex: 1,
    marginRight: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(224, 120, 80, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    color: premiumColors.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  walletAddr: {
    color: premiumColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  settingsBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
  },
  balanceCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: premiumColors.border,
    overflow: "hidden",
  },
  balanceLabel: {
    color: premiumColors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: premiumColors.textPrimary,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  balanceFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: premiumColors.borderSoft,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceSub: {
    color: premiumColors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  balanceLink: {
    color: premiumColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  contactsSection: {},
  sectionLabel: {
    color: premiumColors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  contactsScroll: {
    gap: 14,
    paddingRight: 12,
  },
  contactItem: {
    width: 72,
    alignItems: "center",
  },
  contactAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  contactAvatarText: {
    color: premiumColors.accent,
    fontSize: 20,
    fontWeight: "700",
  },
  contactName: {
    color: premiumColors.textSecondary,
    fontSize: 12,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionItem: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: premiumColors.surface,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  iconPrimary: {
    backgroundColor: premiumColors.accent,
  },
  actionText: {
    color: premiumColors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: premiumColors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  emptyText: {
    color: premiumColors.textMuted,
    textAlign: "center",
    marginTop: 16,
  },
  activityItem: {
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  activityName: {
    color: premiumColors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  activityDate: {
    color: premiumColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  activityRight: {
    alignItems: "flex-end",
  },
  activityAmount: {
    fontWeight: "700",
    fontSize: 15,
  },
  activitySol: {
    color: premiumColors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 10, 20, 0.76)",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(8, 22, 39, 0.98)",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  closeModal: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: premiumColors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: premiumColors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  qrContainer: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginBottom: 16,
  },
  amountToggle: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  amountInput: {
    flex: 1,
    color: premiumColors.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
  },
  amountCurrency: {
    color: premiumColors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
  },
  copyButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  copyText: {
    color: premiumColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  walletList: {
    width: "100%",
    maxHeight: 300,
    marginTop: 12,
  },
  walletItem: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  activeWalletItem: {
    borderColor: premiumColors.accent,
    backgroundColor: "rgba(224, 120, 80, 0.14)",
  },
  walletLabel: {
    color: premiumColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  walletSubAddr: {
    color: premiumColors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  addWalletBtn: {
    marginTop: 8,
    paddingVertical: 10,
  },
  addWalletText: {
    color: premiumColors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
});
