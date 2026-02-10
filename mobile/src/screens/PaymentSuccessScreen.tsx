import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { LucideCheckCircle, LucideShare2, LucideExternalLink, LucideZap, LucideUserPlus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContacts } from "../context/ContactContext";

export function PaymentSuccessScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { saveContact, getContactName } = useContacts();
  const { recipientHandle, inrAmount, signature } = route.params;

  const isAlreadySaved = getContactName(recipientHandle) !== `${recipientHandle.slice(0, 4)}...${recipientHandle.slice(-4)}`;

  const onSaveContact = () => {
    Alert.prompt(
      "Save Contact",
      "Enter a nickname for this recipient",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: (name) => name && saveContact(recipientHandle, name) }
      ],
      'plain-text'
    );
  };

  const onShare = async () => {
    try {
      const message = `Payment Successful!\n\nSent: ₹${inrAmount}\nTo: ${recipientHandle}\nVia: monopay\n\nTransaction ID: ${signature}\nView details: https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      
      await Share.share({
        message,
        title: "Payment Receipt",
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const viewOnExplorer = () => {
    Linking.openURL(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <LucideCheckCircle size={100} color="#14F195" />
        </View>

        <Text style={styles.successText}>Payment Successful</Text>
        <Text style={styles.amountText}>₹{inrAmount}</Text>
        <Text style={styles.recipientText}>to {getContactName(recipientHandle)}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Transaction ID</Text>
          <Text style={styles.infoValue}>{signature.slice(0, 8)}...{signature.slice(-8)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <View style={styles.platformBadge}>
             <LucideZap size={12} color="#14F195" />
             <Text style={styles.platformText}>monopay</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {!isAlreadySaved && (
          <TouchableOpacity style={styles.saveContactButton} onPress={onSaveContact}>
            <LucideUserPlus color="#14F195" size={20} />
            <Text style={styles.saveContactText}>Add to Contacts</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <LucideShare2 color="#000" size={20} />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.explorerButton} onPress={viewOnExplorer}>
          <LucideExternalLink color="#666" size={16} />
          <Text style={styles.explorerButtonText}>View on Solana Explorer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1, padding: 32, alignItems: "center", justifyContent: "center" },
  successIconContainer: { marginBottom: 24 },
  successText: { color: "#14F195", fontSize: 24, fontWeight: "800", marginBottom: 16 },
  amountText: { color: "#fff", fontSize: 56, fontWeight: "900", marginBottom: 8 },
  recipientText: { color: "#999", fontSize: 18, marginBottom: 40 },
  divider: { width: "100%", height: 1, backgroundColor: "#222", marginBottom: 32 },
  infoRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%", 
    marginBottom: 20 
  },
  infoLabel: { color: "#666", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  platformBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    backgroundColor: "#111", 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  platformText: { color: "#14F195", fontSize: 12, fontWeight: "700" },
  footer: { padding: 32, gap: 16, paddingBottom: 48 },
  saveContactButton: {
    backgroundColor: "rgba(20, 241, 149, 0.1)",
    padding: 16,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(20, 241, 149, 0.3)",
    marginBottom: 8,
  },
  saveContactText: { color: "#14F195", fontSize: 16, fontWeight: "700" },
  shareButton: {
    backgroundColor: "#14F195",
    padding: 18,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  shareButtonText: { color: "#000", fontSize: 16, fontWeight: "800" },
  explorerButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  explorerButtonText: { color: "#666", fontSize: 14, fontWeight: "600" },
  doneButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  doneButtonText: { color: "#14F195", fontSize: 16, fontWeight: "700" },
});
