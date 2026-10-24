// HB Works POS - Executive Bottom Tab Bar Component
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

export default function BottomTabBar({
  activeTab,
  onSelectTab,
  cartCount,
}) {
  const tabs = [
    {
      id: 'sell',
      label: 'Register',
      iconActive: 'flash',
      iconInactive: 'flash-outline',
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      iconActive: 'cube',
      iconInactive: 'cube-outline',
      badge: null,
    },
    {
      id: 'income',
      label: 'Analytics',
      iconActive: 'trending-up',
      iconInactive: 'trending-up-outline',
      badge: null,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBarInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.75}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={20}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                {tab.badge !== null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: spacing.lg,
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  inactiveTabLabel: {
    color: colors.textMuted,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 16,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

