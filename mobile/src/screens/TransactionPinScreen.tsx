import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { LucideChevronLeft, LucideDelete, LucideShieldCheck } from "lucide-react-native";
import { usePin } from "../context/PinContext";
import { useWallet } from "../context/WalletContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { runUpiLikePayFlow } from "../features/pay/payController";
import { ApiClient } from "../api/client";
import { API_BASE_URL, DEMO_USER_ID } from "../config";

const { width } = Dimensions.get("window");

export function TransactionPinScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { recipientHandle, recipientWallet, inrAmount, solAmount } = route.params;
  const { verify } = usePin();
  const { getActiveKeypair, refreshBalance } = useWallet() as any;
  
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  const client = new ApiClient({ baseUrl: API_BASE_URL, userId: DEMO_USER_ID });

  const handleKeyPress = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length >= 4) {
      // Auto-submit if pin matches expected length (logic for both 4 and 6)
      // For now, let's assume user clicks a checkmark or waits if it's 6
      if (pin.length === 6) {
        submitPin();
      }
    }
  }, [pin]);

  const submitPin = async () => {
    setIsProcessing(true);
    setStatus("Verifying PIN...");

    try {
      const isPinCorrect = await verify(pin);
      if (!isPinCorrect) {
        Alert.alert("Error", "Incorrect monopay PIN");
        setPin("");
        setIsProcessing(false);
        return;
      }

      setStatus("Sending Transaction...");
      const keypair = await getActiveKeypair();
      if (!keypair) throw new Error("Failed to retrieve account keys");

      const result = await runUpiLikePayFlow(client, {
        recipientHandle,
        recipientWallet,
        inrAmount,
        pin,
        senderKeypair: keypair,
      });


      if (result.ok) {
        await refreshBalance();
        navigation.navigate('PaymentSuccess', {
          recipientHandle,
          inrAmount,
          signature: result.signature
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

  const renderDot = (index: number) => {
    const isActive = pin.length > index;
    return (
      <View 
        key={index} 
        style={[styles.dot, isActive && styles.dotActive]} 
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <LucideChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ENTER monopay PIN</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.txInfo}>
          <Text style={styles.recipientText}>Sending to {recipientHandle}</Text>
          <Text style={styles.amountText}>₹{inrAmount}</Text>
        </View>

        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3, 4, 5].map(i => renderDot(i))}
        </View>

        {isProcessing && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#14F195" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </View>

      {/* Custom Keypad */}
      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <TouchableOpacity 
            key={num} 
            style={styles.key} 
            onPress={() => handleKeyPress(num.toString())}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.key} />
        <TouchableOpacity style={styles.key} onPress={() => handleKeyPress("0")}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <LucideDelete color="#fff" size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
         <LucideShieldCheck color="#666" size={16} />
         <Text style={styles.footerText}>Securely signed by monopay</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 16, letterSpacing: 1 },
  backBtn: { padding: 4 },
  content: { flex: 1, alignItems: "center", paddingTop: 40 },
  txInfo: { alignItems: "center", marginBottom: 60 },
  recipientText: { color: "#999", fontSize: 16, marginBottom: 8 },
  amountText: { color: "#fff", fontSize: 48, fontWeight: "900" },
  pinDisplay: { flexDirection: "row", gap: 20, marginBottom: 40 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: "#14F195",
    borderColor: "#14F195",
  },
  loaderContainer: { alignItems: "center", gap: 12 },
  statusText: { color: "#14F195", fontSize: 14, fontWeight: "600" },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    paddingBottom: 40,
  },
  key: {
    width: "33.33%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { color: "#fff", fontSize: 32, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    gap: 8,
  },
  footerText: { color: "#666", fontSize: 12 },
});
