import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LucideScan, LucideX } from "lucide-react-native";
import { ScalePressable } from "./ScalePressable";
import { premiumColors } from "../theme/premium";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
};

export function QRScanner({ visible, onClose, onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionText}>Allow camera access to scan monopay QR codes instantly.</Text>
            <ScalePressable style={styles.permissionButton} onPress={requestPermission} haptic="light">
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </ScalePressable>
          </View>
          <ScalePressable style={styles.closeButton} onPress={onClose} haptic="light">
            <LucideX color={premiumColors.textPrimary} size={24} />
          </ScalePressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={({ data }) => {
            onScan(data);
            onClose();
          }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View style={styles.focusBadge}>
                <LucideScan color={premiumColors.accent} size={14} />
                <Text style={styles.focusBadgeText}>Scan QR</Text>
              </View>
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>

        <ScalePressable style={styles.closeButton} onPress={onClose} haptic="light">
          <LucideX color={premiumColors.textPrimary} size={30} />
        </ScalePressable>

        <View style={styles.footer} pointerEvents="none">
          <Text style={styles.footerText}>Align code inside the frame</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumColors.bgBottom,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: premiumColors.bgBottom,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: premiumColors.surface,
    padding: 20,
  },
  permissionTitle: {
    color: premiumColors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  permissionText: {
    color: premiumColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  permissionButton: {
    borderRadius: 14,
    backgroundColor: premiumColors.accent,
    paddingVertical: 13,
    alignItems: "center",
  },
  permissionButtonText: {
    color: premiumColors.darkText,
    fontWeight: "800",
    fontSize: 15,
  },
  closeButton: {
    position: "absolute",
    top: 58,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(7, 17, 31, 0.7)",
    borderWidth: 1,
    borderColor: premiumColors.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(4,10,18,0.72)",
  },
  middleContainer: {
    flexDirection: "row",
    height: 270,
  },
  focusedContainer: {
    width: 270,
    borderWidth: 2,
    borderColor: premiumColors.accent,
    backgroundColor: "transparent",
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  focusBadge: {
    margin: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: premiumColors.border,
    backgroundColor: "rgba(5, 16, 29, 0.8)",
  },
  focusBadgeText: {
    color: premiumColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 74,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: premiumColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
