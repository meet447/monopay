import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LucideChevronRight, LucideShieldCheck } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePin } from "../context/PinContext";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { LinearGradient } from "expo-linear-gradient";
import { premiumColors, premiumGradients } from "../theme/premium";

export function PinEnrollScreen() {
  const insets = useSafeAreaInsets();
  const { enroll } = usePin();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const inputRef = useRef<TextInput>(null);
  const transitionAnim = useMemo(() => new Animated.Value(1), []);

  const activePin = step === 1 ? pin : confirmPin;
  const setActivePin = step === 1 ? setPin : setConfirmPin;

  const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, 6);

  const runStepTransition = (nextStep: 1 | 2) => {
    Animated.sequence([
      Animated.timing(transitionAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(transitionAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    setStep(nextStep);
  };

  const handleNext = () => {
    if (pin.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits");
      return;
    }
    runStepTransition(2);
    inputRef.current?.focus();
  };

  const handleEnroll = async () => {
    if (pin !== confirmPin) {
      Alert.alert("Error", "PINs do not match");
      setConfirmPin("");
      inputRef.current?.focus();
      return;
    }

    try {
      await enroll(pin);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const buttonDisabled = activePin.length < 4;

  return (
    <PremiumBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { paddingTop: insets.top + 12 }]}
      >
        <Animated.View
          style={{
            opacity: transitionAnim,
            transform: [
              {
                translateY: transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.iconShell}>
            <LucideShieldCheck size={34} color={premiumColors.accent} />
          </View>
          <Text style={styles.title}>{step === 1 ? "Create payment PIN" : "Confirm your PIN"}</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? "This PIN secures approvals for every transfer."
              : "Re-enter your PIN to finish secure setup."}
          </Text>
        </Animated.View>

        <GlassCard style={styles.pinCard}>
          <ScalePressable style={styles.pinSurface} onPress={() => inputRef.current?.focus()} haptic="light">
            <View style={styles.dotRow}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activePin.length > index && styles.dotFilled,
                    step === 2 && pin.length > index && activePin.length <= index && styles.dotGhost,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.pinHint}>{activePin.length === 0 ? "Tap to enter PIN" : `${activePin.length} digits entered`}</Text>
          </ScalePressable>

          <TextInput
            ref={inputRef}
            value={activePin}
            onChangeText={(v) => setActivePin(sanitizePin(v))}
            keyboardType="number-pad"
            style={styles.hiddenInput}
            autoFocus
            textContentType="oneTimeCode"
          />

          <View style={styles.progressRow}>
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={[styles.progressStep, step === 2 && styles.progressStepActive]} />
          </View>

          <ScalePressable
            disabled={buttonDisabled}
            style={[styles.actionWrap, buttonDisabled && styles.actionWrapDisabled]}
            onPress={step === 1 ? handleNext : handleEnroll}
            haptic="medium"
          >
            <LinearGradient
              colors={[...premiumGradients.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>{step === 1 ? "Continue" : "Set PIN"}</Text>
              <LucideChevronRight size={18} color={premiumColors.darkText} />
            </LinearGradient>
          </ScalePressable>
        </GlassCard>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    color: premiumColors.textPrimary,
    fontSize: 33,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.7,
    marginBottom: 10,
  },
  subtitle: {
    color: premiumColors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  pinCard: {
    marginTop: 8,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  pinSurface: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dotRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: premiumColors.accent,
    borderColor: premiumColors.accent,
  },
  dotGhost: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  pinHint: {
    color: premiumColors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  hiddenInput: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  progressRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  progressStep: {
    height: 6,
    width: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressStepActive: {
    backgroundColor: premiumColors.accent,
  },
  actionWrap: {
    marginTop: 22,
    borderRadius: 20,
    overflow: "hidden",
  },
  actionWrapDisabled: {
    opacity: 0.55,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    color: premiumColors.darkText,
    fontSize: 17,
    fontWeight: "800",
  },
});
