import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { 
  LucideZap, 
  LucideScan, 
  LucideArrowUpRight, 
  LucideArrowDownLeft, 
  LucideSettings,
  LucideCopy,
  LucideX,
  LucideUsers,
} from "lucide-react-native";
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useWallet } from "../context/WalletContext";
import { useContacts } from "../context/ContactContext";
import { QRScanner } from "../components/QRScanner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PriceService } from "../utils/prices";

const { width } = Dimensions.get('window');

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
    isLoadingTransactions
  } = useWallet() as any;
  const { frequentPayees, getContactName } = useContacts();

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const [amount, setAmount] = useState("");

  const solanaPayUri = useMemo(() => {
    if (!publicKey) return "";
    return `solana:${publicKey.toBase58()}?amount=${amount || 0}&label=SolUPI`;
  }, [publicKey, amount]);

  const onScan = (data: string) => {
    setIsScannerVisible(false);
    navigation.navigate('Pay', { qrData: data });
  };

  const copyAddress = async () => {
    if (!publicKey) return;
    await Clipboard.setStringAsync(publicKey.toBase58());
    Alert.alert("Success", "Address copied to clipboard");
  };

  const requestAirdrop = async () => {
    if (!publicKey) return;
    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      await refreshBalance();
      Alert.alert("Success", "1 SOL dropped into your account!");
    } catch (e: any) {
      Alert.alert(
        "Faucet Busy", 
        "Solana's public faucet is currently rate-limited. \n\nPlease use: https://faucet.solana.com/ (Select Devnet) \n\nAddress copied to clipboard!",
        [{ text: "Copy Address & Close", onPress: async () => {
           await Clipboard.setStringAsync(publicKey.toBase58());
        }}]
      );
    }
  };

  const formatTx = (tx: any) => {
    const time = tx.time ? new Date(tx.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending';
    const date = tx.time ? new Date(tx.time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
    
    const instructions = tx.details?.transaction?.message?.instructions;
    const transferIx = instructions?.find((ix: any) => ix.program === 'system' && ix.parsed?.type === 'transfer');
    
    if (transferIx) {
      const info = transferIx.parsed.info;
      const isSent = info.source === publicKey.toBase58();
      const amountSol = info.lamports / LAMPORTS_PER_SOL;
      const amountInr = (amountSol * solPrice).toLocaleString(undefined, { maximumFractionDigits: 0 });
      
      return {
        label: isSent ? `Sent to ${getContactName(info.destination)}` : `Received from ${getContactName(info.source)}`,
        subLabel: `${date}, ${time}`,
        amount: `${isSent ? '-' : '+'} ₹${amountInr}`,
        isSent,
        sol: `${amountSol.toFixed(4)} SOL`
      };
    }
    
    return {
      label: 'Other Transaction',
      subLabel: `${date}, ${time}`,
      amount: '---',
      isSent: false,
      sol: tx.signature.slice(0, 8) + '...'
    };
  };

  if (!publicKey) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowWalletModal(true)} style={styles.walletSelector}>
          <LucideUsers color="#14F195" size={20} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greeting}>Active Account</Text>
            <Text style={styles.walletAddr}>
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={disconnect} style={styles.settingsBtn}>
          <LucideSettings color="#666" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {balance !== null ? `₹${(balance * solPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}` : '₹0.00'}
          </Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceSub}>
              {balance !== null ? `${balance.toFixed(4)} SOL` : '0.00 SOL'}
            </Text>
            {balance === 0 && (
              <TouchableOpacity onPress={requestAirdrop}>
                <Text style={{ color: '#14F195', fontSize: 12, fontWeight: '700' }}>
                  Request Test SOL
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Contacts */}
        {frequentPayees.length > 0 && (
          <View style={styles.contactsSection}>
            <Text style={styles.sectionTitleSmall}>Quick Pay</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsScroll}>
              {frequentPayees.map(contact => (
                <TouchableOpacity 
                  key={contact.address} 
                  style={styles.contactItem}
                  onPress={() => navigation.navigate('Pay', { qrData: contact.address })}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{contact.name.substring(0, 1).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => setIsScannerVisible(true)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#14F195' }]}>
              <LucideScan color="#000" size={28} />
            </View>
            <Text style={styles.actionText}>Scan & Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setShowReceiveModal(true)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <LucideArrowDownLeft color="#14F195" size={28} />
            </View>
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Pay')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <LucideArrowUpRight color="#fff" size={28} />
            </View>
            <Text style={styles.actionText}>To Handle</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {isLoadingTransactions && transactions.length === 0 ? (
            <ActivityIndicator color="#14F195" style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={{ color: '#444', textAlign: 'center', marginTop: 20 }}>No transactions yet</Text>
          ) : (
            transactions.map((tx) => {
              const formatted = formatTx(tx);
              return (
                <View key={tx.signature} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <LucideZap color={formatted.isSent ? "#ff4d4d" : "#14F195"} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityName}>{formatted.label}</Text>
                    <Text style={styles.activityDate}>{formatted.subLabel}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.activityAmount, { color: formatted.isSent ? "#fff" : "#14F195" }]}>
                      {formatted.amount}
                    </Text>
                    <Text style={{ color: '#444', fontSize: 10 }}>{formatted.sol}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Receive Modal */}
      {showReceiveModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModal} 
              onPress={() => setShowReceiveModal(false)}
            >
              <LucideX color="#666" size={24} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Your SolUPI QR</Text>
            <Text style={styles.modalSubtitle}>Scan to pay securely on Solana</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={solanaPayUri}
                size={200}
                color="black"
                backgroundColor="white"
              />
            </View>

            <View style={styles.amountToggle}>
               <TextInput
                  style={styles.amountInput}
                  placeholder="Set Amount (optional)"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
               />
               <Text style={styles.amountCurrency}>INR</Text>
            </View>

            <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
              <LucideCopy color="#14F195" size={18} />
              <Text style={styles.copyText}>Copy Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Wallet Switcher Modal */}
      {showWalletModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeModal} onPress={() => setShowWalletModal(false)}>
              <LucideX color="#000" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Switch Account</Text>
            <ScrollView style={{ width: '100%', maxHeight: 300 }}>
              {allWallets.map((w: any) => (
                <TouchableOpacity 
                  key={w.address} 
                  style={[
                    styles.walletItem,
                    publicKey.toBase58() === w.address && styles.activeWalletItem
                  ]}
                  onPress={() => {
                    switchWallet(w.address);
                    setShowWalletModal(false);
                  }}
                >
                  <Text style={styles.walletLabel}>{w.label}</Text>
                  <Text style={styles.walletSubAddr}>{w.address.slice(0, 8)}...{w.address.slice(-8)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.addWalletBtn}
              onPress={() => {
                setShowWalletModal(false);
                disconnect(); 
              }}
            >
              <Text style={styles.addWalletText}>+ Link New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <QRScanner 
        visible={isScannerVisible} 
        onClose={() => setIsScannerVisible(false)} 
        onScan={onScan} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contactsSection: { marginBottom: 32 },
  sectionTitleSmall: { color: "#666", fontSize: 13, fontWeight: "700", marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  contactsScroll: { gap: 20 },
  contactItem: { alignItems: 'center', width: 64 },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactAvatarText: { color: '#14F195', fontSize: 20, fontWeight: '700' },
  contactName: { color: '#999', fontSize: 12, textAlign: 'center' },
  container: { flex: 1, backgroundColor: "#000" },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    flex: 1,
    marginRight: 16,
  },
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
  addWalletBtn: { marginTop: 16, padding: 12 },
  addWalletText: { color: '#14F195', fontWeight: '700' },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 12,
  },
  greeting: { color: "#666", fontSize: 12 },
  walletAddr: { color: "#fff", fontSize: 16, fontWeight: "700" },
  settingsBtn: { backgroundColor: "#111", padding: 10, borderRadius: 12 },
  scrollContent: { padding: 24, paddingTop: 0 },
  balanceCard: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 32,
  },
  balanceLabel: { color: "#666", fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: "#fff", fontSize: 36, fontWeight: "900" },
  balanceFooter: { 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: "#222",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceSub: { color: "#14F195", fontWeight: "600" },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  actionItem: { alignItems: "center", gap: 10 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  section: { gap: 16 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#080808",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  activityIcon: { backgroundColor: "#111", padding: 10, borderRadius: 12 },
  activityName: { color: "#fff", fontWeight: "600", fontSize: 15 },
  activityDate: { color: "#444", fontSize: 12 },
  activityAmount: { color: "#fff", fontWeight: "700", fontSize: 16 },
  
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
  },
  closeModal: { position: "absolute", top: 20, right: 20 },
  modalTitle: { fontSize: 24, fontWeight: "800", color: "#000", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 32 },
  qrContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 24,
  },
  amountToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  amountInput: { flex: 1, padding: 12, fontSize: 16, color: "#000" },
  amountCurrency: { fontWeight: "700", color: "#999" },
  copyButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  copyText: { color: "#000", fontWeight: "600" },
});
