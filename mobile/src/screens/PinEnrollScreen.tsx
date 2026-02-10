import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LucideShieldCheck, LucideChevronRight } from "lucide-react-native";
import { usePin } from "../context/PinContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PinEnrollScreen() {
  const insets = useSafeAreaInsets();
  const { enroll } = usePin();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (pin.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits");
      return;
    }
    setStep(2);
  };

  const handleEnroll = async () => {
    if (pin !== confirmPin) {
      Alert.alert("Error", "PINs do not match");
      return;
    }
    try {
      await enroll(pin);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <LucideShieldCheck size={64} color="#14F195" style={styles.heroIcon} />
        <Text style={styles.title}>
          {step === 1 ? "Create monopay PIN" : "Confirm PIN"}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? "This PIN will be used to authorize your Solana payments instantly."
            : "Re-enter your PIN to confirm."}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.pinInput}
            value={step === 1 ? pin : confirmPin}
            onChangeText={step === 1 ? setPin : setConfirmPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            placeholder="••••••"
            placeholderTextColor="#333"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={step === 1 ? handleNext : handleEnroll}
        >
          <Text style={styles.buttonText}>
            {step === 1 ? "Continue" : "Set PIN"}
          </Text>
          <LucideChevronRight size={20} color="#000" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  heroIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 48,
  },
  pinInput: {
    fontSize: 48,
    color: "#fff",
    letterSpacing: 20,
    textAlign: "center",
    width: "100%",
  },
  button: {
    backgroundColor: "#14F195",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
});
