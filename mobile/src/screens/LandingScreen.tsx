import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { LucideZap, LucidePlus } from "lucide-react-native";
import { useWallet } from "../context/WalletContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { importWallet } = useWallet() as any;
  const [showImport, setShowImport] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [label] = useState("Main Account");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!privateKey) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await importWallet(privateKey, label);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <LucideZap size={80} color="#14F195" style={styles.logo} />
            <Text style={styles.title}>SolUPI</Text>
            <Text style={styles.subtitle}>Solana payments as simple as UPI.</Text>

            {!showImport ? (
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => setShowImport(true)}
                >
                  <LucidePlus color="#000" size={20} />
                  <Text style={styles.buttonText}>Link Bank (Wallet)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.importForm}>
                <Text style={styles.label}>Enter Secret Key</Text>
                <TextInput
                  style={styles.input}
                  value={privateKey}
                  onChangeText={setPrivateKey}
                  placeholder="Private Key (Secret Array or Base58)"
                  placeholderTextColor="#444"
                  secureTextEntry={false}
                  multiline={true}
                  blurOnSubmit={true}
                  onSubmitEditing={handleImport}
                />
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleImport}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Link Account</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowImport(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1, padding: 32, justifyContent: "center", alignItems: "center" },
  logo: { marginBottom: 16 },
  title: { fontSize: 48, fontWeight: "900", color: "#fff" },
  subtitle: { fontSize: 18, color: "#666", textAlign: "center", marginBottom: 64 },
  buttonGroup: { width: "100%", gap: 16 },
  primaryButton: {
    backgroundColor: "#14F195",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  buttonText: { color: "#000", fontSize: 18, fontWeight: "700" },
  importForm: { width: "100%", gap: 16 },
  label: { color: "#999", fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    minHeight: 120,
    fontSize: 14,
  },
  cancelText: { color: "#666", textAlign: "center", marginTop: 8 },
});
