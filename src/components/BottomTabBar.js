// HB Works POS - Bottom Tab Bar Component
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
      label: 'Sell',
      iconActive: 'cart',
      iconInactive: 'cart-outline',
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
      label: 'Income',
      iconActive: 'bar-chart',
      iconInactive: 'bar-chart-outline',
      badge: null,
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={22}
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
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  activeTabButton: {
    backgroundColor: colors.surfaceLight,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  inactiveTabLabel: {
    color: colors.textMuted,
  },
});
