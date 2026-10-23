// HB Works POS - Camera Barcode Scanner Modal
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radius, spacing } from '../theme';

export default function CameraScannerModal({
  visible,
  onClose,
  onScan,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(true);

  // Laser scan line animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsScanningActive(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }) => {
    if (!isScanningActive || !data) return;
    setIsScanningActive(false);
    onScan(data);
    onClose();
  };

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (trimmed) {
      onScan(trimmed);
      setManualCode('');
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <TouchableOpacity
            onPress={() => setTorchOn(!torchOn)}
            style={[styles.headerButton, torchOn && styles.torchActive]}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={22}
              color={torchOn ? '#F59E0B' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Area */}
        <View style={styles.viewfinderContainer}>
          {Platform.OS !== 'web' && permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code39',
                  'code128',
                  'itf14',
                  'codabar',
                ],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : (
            <View style={styles.webFallbackView}>
              <Ionicons name="barcode-outline" size={64} color={colors.primary} />
              <Text style={styles.fallbackTitle}>
                {Platform.OS === 'web'
                  ? 'Barcode Viewfinder Active'
                  : 'Camera Permission Needed'}
              </Text>
              {!permission?.granted && Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={styles.permissionBtn}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Reticle Overlay with Corner Markers */}
          <View style={styles.reticleBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Sweeping Laser Line */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: laserAnim }] },
              ]}
            />
          </View>
        </View>

        {/* Bottom Instruction & Manual Entry Bar */}
        <View style={styles.footer}>
          <Text style={styles.tipText}>
            Point camera at product barcode or enter SKU manually:
          </Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter barcode or SKU..."
              placeholderTextColor={colors.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.manualSubmitBtn}
              onPress={handleManualSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.manualSubmitText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  viewfinderContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFallbackView: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reticleBox: {
    width: 260,
    height: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  laserLine: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: colors.scannerLaser,
    shadowColor: colors.scannerLaser,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  manualSubmitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  manualSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
