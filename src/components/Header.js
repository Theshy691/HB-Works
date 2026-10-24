// HB Works POS - Executive Header Component
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

export default function Header({
  title,
  isOnline,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}) {
  return (
    <View style={styles.container}>
      {/* Brand & Store Profile */}
      <View style={styles.leftSection}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/hb-logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.brandTextCol}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>HB WORKS</Text>
            <View style={styles.racingTag}>
              <Text style={styles.racingTagText}>POS</Text>
            </View>
          </View>
          <Text style={styles.brandSub}>TAGUIG CITY • MOTOR SHOP</Text>
        </View>
      </View>

      {/* Status & Quick Action Cluster */}
      <View style={styles.rightSection}>
        {/* Hardware Gun Listener Pill */}
        <View style={styles.scannerBadge}>
          <Ionicons name="barcode-outline" size={14} color={colors.cashTender} />
          <View style={styles.statusLiveDot} />
          <Text style={styles.scannerBadgeText}>GUN READY</Text>
        </View>

        {/* Database Cloud Sync Status Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Ionicons
            name="cloud-done"
            size={18}
            color={isOnline ? colors.success : colors.warning}
          />
        </TouchableOpacity>

        {/* Tactile Audio Feedback Toggle */}
        <TouchableOpacity
          style={[styles.actionButton, soundEnabled && styles.actionButtonActive]}
          onPress={onToggleSound}
          activeOpacity={0.7}
        >
          <Ionicons
            name={soundEnabled ? 'volume-high' : 'volume-mute'}
            size={18}
            color={soundEnabled ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>

        {/* System Settings Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  racingTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  racingTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  scannerBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
});

