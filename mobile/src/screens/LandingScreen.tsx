import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LucideChevronRight, LucidePlus, LucideZap } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../context/WalletContext";
import { VPA_DOMAIN } from "../config";
import { PremiumBackground } from "../components/PremiumBackground";
import { GlassCard } from "../components/GlassCard";
import { ScalePressable } from "../components/ScalePressable";
import { premiumColors, premiumGradients } from "../theme/premium";
import { LinearGradient } from "expo-linear-gradient";

export function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { importWallet } = useWallet() as any;

  const [showImport, setShowImport] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [handle, setHandle] = useState("");
  const [label] = useState("Main Account");
  const [loading, setLoading] = useState(false);

  const heroAnim = useMemo(() => new Animated.Value(0), []);
  const formAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  const handleShowImport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImport(true);
    Animated.timing(formAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleHideImport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(formAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowImport(false));
  };

  const handleImport = async () => {
    if (!privateKey) return;
    if (!handle) {
      Alert.alert("Required", "Please choose a monopay handle.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      await importWallet(privateKey, label, handle);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const heroTranslate = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const formTranslate = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  return (
    <PremiumBackground>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}> 
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View
                style={{
                  opacity: heroAnim,
                  transform: [{ translateY: heroTranslate }],
                }}
              >
                <View style={styles.logoShell}>
                  <LinearGradient
                    colors={[...premiumGradients.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoCore}
                  >
                    <LucideZap size={38} color={premiumColors.darkText} strokeWidth={2.4} />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>monopay</Text>
                <Text style={styles.subtitle}>Fast money movement with a calm, beautiful flow.</Text>
              </Animated.View>

              <GlassCard style={styles.valueCard}>
                <Text style={styles.valueTitle}>Premium Payment Experience</Text>
                <Text style={styles.valueText}>Secure account, instant transfer flow, and smooth interactions designed for daily finance.</Text>
              </GlassCard>

              {!showImport ? (
                <ScalePressable
                  onPress={handleShowImport}
                  haptic="medium"
                  style={styles.primaryButton}
                >
                  <LinearGradient
                    colors={[...premiumGradients.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <LucidePlus color={premiumColors.darkText} size={20} />
                    <Text style={styles.primaryButtonText}>Link Wallet</Text>
                    <LucideChevronRight color={premiumColors.darkText} size={18} />
                  </LinearGradient>
                </ScalePressable>
              ) : null}
            </ScrollView>

            {showImport ? (
              <View style={styles.sheetOverlay}>
                <TouchableWithoutFeedback onPress={handleHideImport}>
                  <View style={styles.sheetBackdrop} />
                </TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.sheet,
                    {
                      opacity: formAnim,
                      transform: [{ translateY: formTranslate }],
                    },
                  ]}
                >
                  <Text style={styles.sheetTitle}>Link Your Wallet</Text>
                  <Text style={styles.sheetSubtitle}>Set your handle and import your private key.</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Handle</Text>
                    <TextInput
                      style={styles.inputSingle}
                      value={handle}
                      onChangeText={setHandle}
                      placeholder="e.g. aryan"
                      placeholderTextColor={premiumColors.textMuted}
                      autoCapitalize="none"
                    />
                    <Text style={styles.hint}>Your VPA will be {handle || "name"}{VPA_DOMAIN}</Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Private Key</Text>
                    <TextInput
                      style={styles.input}
                      value={privateKey}
                      onChangeText={setPrivateKey}
                      placeholder="Secret array or base58 private key"
                      placeholderTextColor={premiumColors.textMuted}
                      multiline
                    />
                  </View>

                  <ScalePressable
                    onPress={handleImport}
                    disabled={loading}
                    haptic="medium"
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  >
                    <LinearGradient
                      colors={[...premiumGradients.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color={premiumColors.darkText} />
                      ) : (
                        <Text style={styles.submitButtonText}>Link Account</Text>
                      )}
                    </LinearGradient>
                  </ScalePressable>

                  <ScalePressable onPress={handleHideImport} style={styles.cancelWrap} haptic="light">
                    <Text style={styles.cancelText}>Cancel</Text>
                  </ScalePressable>
                </Animated.View>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
    gap: 24,
    justifyContent: "center",
  },
  logoShell: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  logoCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 46,
    fontWeight: "800",
    color: premiumColors.textPrimary,
    textAlign: "center",
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    color: premiumColors.textSecondary,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  valueCard: {
    marginTop: 6,
    paddingVertical: 20,
  },
  valueTitle: {
    color: premiumColors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  valueText: {
    color: premiumColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    borderRadius: 22,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    borderRadius: 22,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: premiumColors.darkText,
    fontSize: 17,
    fontWeight: "800",
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 8, 15, 0.72)",
  },
  sheet: {
    backgroundColor: "rgba(9, 24, 42, 0.96)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
  },
  sheetTitle: {
    color: premiumColors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  sheetSubtitle: {
    color: premiumColors.textSecondary,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: premiumColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputSingle: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: premiumColors.textPrimary,
    fontSize: 16,
  },
  input: {
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: premiumColors.borderSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: premiumColors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  hint: {
    marginTop: 6,
    color: premiumColors.textMuted,
    fontSize: 12,
  },
  submitButton: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: premiumColors.darkText,
    fontSize: 16,
    fontWeight: "800",
  },
  cancelWrap: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelText: {
    color: premiumColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
