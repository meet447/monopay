import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LucideX } from "lucide-react-native";

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
        <View style={styles.container}>
          <Text style={styles.text}>We need your permission to show the camera</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <LucideX color="#fff" size={24} />
          </TouchableOpacity>
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
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        
        {/* Absolute positioned overlay to fix Android warning */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer} />
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <LucideX color="#fff" size={32} />
        </TouchableOpacity>
        
        <View style={styles.footer} pointerEvents="none">
          <Text style={styles.footerText}>Scan SolPay or UPI QR</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#14F195",
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  middleContainer: {
    flexDirection: "row",
    height: 250,
  },
  focusedContainer: {
    width: 250,
    borderWidth: 2,
    borderColor: "#14F195",
    backgroundColor: "transparent",
    borderRadius: 16,
  },
  footer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});
