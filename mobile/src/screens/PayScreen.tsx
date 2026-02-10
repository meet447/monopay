import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LucideWallet, LucideZap, LucideShieldCheck, LucideScanQrCode, LucideInfo, LucideChevronLeft, LucideChevronDown, LucideX } from "lucide-react-native";
import { useWallet } from "../context/WalletContext";
import { usePin } from "../context/PinContext";
import { useQuote } from "../hooks/useQuote";
import { ApiClient } from "../api/client";
import { runUpiLikePayFlow } from "../features/pay/payController";
import { QRScanner } from "../components/QRScanner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";

type Props = {
  apiBaseUrl: string;
  userId: string;
  navigation: any;
  route: any;
};

export function PayScreen({ apiBaseUrl, userId, navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { publicKey, allWallets, switchWallet, isLoading: isConnecting } = useWallet() as any;
  
  const [handle, setHandle] = useState(route?.params?.qrData || "");
  const [resolvedName, setResolvedName] = useState("");
  const [recipientWallet, setRecipientWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Resolution effect
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
        const client = new ApiClient({ baseUrl: API_BASE_URL });
        const res = await client.resolveHandle(handle);
        setResolvedName(res.handle);
        setRecipientWallet(res.wallet);
        setIsVerified(true);
      } catch (e) {
        setResolvedName("Unknown User");
        setRecipientWallet(null);
        setIsVerified(false);
      } finally {
        setIsResolving(false);
      }
    }, 500); // Debounce resolution
    return () => clearTimeout(timer);
  }, [handle]);

  // Update handle if route params change
  useEffect(() => {
    if (route?.params?.qrData) {
      let resolvedHandle = route.params.qrData;
      if (resolvedHandle.startsWith("solana:")) {
         resolvedHandle = resolvedHandle.split(":")[1].split("?")[0];
      }
      setHandle(resolvedHandle);
    }
  }, [route?.params?.qrData]);

  const { quote, isLoading: isQuoteLoading } = useQuote(amount);

  const onPayPress = () => {
    if (!isVerified || !recipientWallet) {
      Alert.alert("Error", "Please enter a valid monopay handle");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    // Navigate to dedicated PIN screen
    navigation.navigate('TransactionPin', {
      recipientHandle: handle,
      recipientWallet: recipientWallet,
      inrAmount: parseFloat(amount),
      solAmount: quote?.sol
    });
  };


  if (!publicKey) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <LucideChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Money</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Recipient Profile */}
          <View style={styles.recipientCard}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>
                {isResolving ? ".." : (handle && handle.length > 1 ? (handle.startsWith("@") ? handle.substring(1, 3) : handle.substring(0, 2)) : "?").toUpperCase()}
               </Text>
               {isVerified && (
                 <View style={styles.verifiedBadge}>
                   <LucideShieldCheck color="#000" size={12} />
                 </View>
               )}
            </View>
            
            <View style={styles.handleInputContainer}>
              <TextInput
                style={styles.handleInput}
                value={handle}
                onChangeText={setHandle}
                placeholder="Enter VPA (e.g. alice)"
                placeholderTextColor="#222"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!handle.includes("@") && handle.length > 0 && (
                <Text style={styles.vpaHint}>@monopay.app</Text>
              )}
            </View>

            <Text style={[styles.recipientHandle, isVerified && { color: '#14F195' }]}>
              {isResolving ? "Verifying handle..." : handle.length > 0 ? (isVerified ? `Verified: ${resolvedName}` : resolvedName) : "Enter a monopay handle to pay"}
            </Text>
          </View>

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.hugeAmountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#333"
                autoFocus
              />
            </View>
            
            {quote && (
              <View style={styles.quotePill}>
                <Text style={styles.quotePillText}>≈ {quote.sol} SOL</Text>
              </View>
            )}
          </View>

          {/* Message Input */}
          <TextInput 
            style={styles.messageInput}
            placeholder="Add a message"
            placeholderTextColor="#666"
          />
        </ScrollView>

        {/* Bottom Pay Bar */}
        <View style={styles.bottomBar}>
           {/* Wallet Selector */}
           <TouchableOpacity 
             style={styles.walletSelectorCompact}
             onPress={() => setShowWalletPicker(true)}
           >
             <View style={styles.bankIcon}>
                <LucideWallet color="#14F195" size={16} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.walletNameCompact}>
                  {allWallets.find((w: any) => w.address === publicKey.toBase58())?.handle || "Solana Account"}
                </Text>
                <Text style={styles.walletAddrCompact}>
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </Text>
             </View>
             <LucideChevronDown color="#666" size={20} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={[styles.payButtonMain, (!amount || isQuoteLoading) && styles.disabledButton]} 
             onPress={onPayPress}
             disabled={!amount || isQuoteLoading}
           >
             <Text style={styles.payButtonTextMain}>Pay ₹{amount || "0"}</Text>
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Wallet Selection Modal */}
      {showWalletPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeModal} onPress={() => setShowWalletPicker(false)}>
              <LucideX color="#000" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choose Account</Text>
            {allWallets.map((w: any) => (
              <TouchableOpacity 
                key={w.address} 
                style={[
                  styles.walletItem,
                  publicKey.toBase58() === w.address && styles.activeWalletItem
                ]}
                onPress={() => {
                  switchWallet(w.address);
                  setShowWalletPicker(false);
                }}
              >
                <Text style={styles.walletLabel}>{w.handle || w.label}</Text>
                <Text style={styles.walletSubAddr}>{w.address.slice(0, 8)}...{w.address.slice(-8)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 16,
  },
  backBtn: { padding: 4 },
  scrollContent: { padding: 24, alignItems: 'center' },
  recipientCard: { alignItems: 'center', marginBottom: 40 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#14F19522',
    borderWidth: 1,
    borderColor: '#14F19544',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#14F195', fontSize: 24, fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#14F195',
    borderRadius: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  handleInputContainer: {
    width: '100%',
    marginVertical: 8,
    alignItems: 'center',
  },
  handleInput: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    padding: 8,
  },
  vpaHint: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -8,
  },
  recipientName: { color: '#fff', fontSize: 24, fontWeight: '800' },
  recipientHandle: { color: '#666', fontSize: 14, marginTop: 4 },
  
  amountContainer: { alignItems: 'center', marginVertical: 20 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: '#fff', fontSize: 40, fontWeight: '700', marginRight: 8 },
  hugeAmountInput: { color: '#fff', fontSize: 64, fontWeight: '900', minWidth: 100 },
  quotePill: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  quotePillText: { color: '#14F195', fontWeight: '700', fontSize: 14 },
  messageInput: {
    backgroundColor: '#080808',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#111',
  },
  
  bottomBar: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  walletSelectorCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  bankIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletNameCompact: { color: '#fff', fontSize: 14, fontWeight: '700' },
  walletAddrCompact: { color: '#666', fontSize: 12 },
  payButtonMain: {
    backgroundColor: "#14F195",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  payButtonTextMain: { color: "#000", fontSize: 18, fontWeight: "800" },
  disabledButton: { opacity: 0.5 },
  
  // Modal Overrides
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  closeModal: { position: "absolute", top: 16, right: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  walletItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
    width: '100%',
  },
  activeWalletItem: {
    borderColor: '#14F195',
    backgroundColor: '#f0fff4',
  },
  walletLabel: { fontWeight: '700', color: '#000', fontSize: 16 },
  walletSubAddr: { color: '#666', fontSize: 12, marginTop: 4 },
});
