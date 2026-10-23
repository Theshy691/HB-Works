// HB Works POS - Header Component
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
      <View style={styles.leftSection}>
        <Image
          source={require('../../assets/hb-logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {/* Scanner Gun Status Indicator */}
        <View style={styles.gunPill}>
          <View style={styles.gunDot} />
          <Text style={styles.gunText}>Gun Ready</Text>
        </View>

        {/* Database Cloud Sync Status Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-outline" size={20} color={colors.text} />
          <View
            style={[
              styles.dbStatusDot,
              { backgroundColor: isOnline ? colors.success : colors.danger },
            ]}
          />
        </TouchableOpacity>

        {/* Sound Toggle Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onToggleSound}
          activeOpacity={0.7}
        >
          <Ionicons
            name={soundEnabled ? 'volume-high-outline' : 'volume-mute-outline'}
            size={20}
            color={soundEnabled ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 85, 0.3)',
  },
  titleText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gunPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  gunDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  gunText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dbStatusDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
