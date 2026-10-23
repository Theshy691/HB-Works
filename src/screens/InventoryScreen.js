// HB Works POS - Inventory Management Screen
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, formatCurrency } from '../theme';

export default function InventoryScreen({
  products,
  onOpenReceiveStock,
  onAdjustStock,
  onDeleteProduct,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'low'

  const lowStockThreshold = 10;

  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => (p.quantity_in_stock || 0) <= lowStockThreshold
    ).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isLow = (p.quantity_in_stock || 0) <= lowStockThreshold;
      if (filterMode === 'low' && !isLow) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = p.name && p.name.toLowerCase().includes(q);
      const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(q);
      const catMatch = p.category && p.category.toLowerCase().includes(q);
      return nameMatch || barcodeMatch || catMatch;
    });
  }, [products, filterMode, searchQuery]);

  const handleDelete = (product) => {
    const confirmMessage = `Are you sure you want to delete "${product.name}"?`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        onDeleteProduct(product.id);
      }
    } else {
      Alert.alert('Confirm Delete', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteProduct(product.id),
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Controls: Search & Add Stock */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory or barcode..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={onOpenReceiveStock}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterMode === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setFilterMode('all')}
          >
            <Text
              style={[
                styles.filterText,
                filterMode === 'all' && styles.filterTextActive,
              ]}
            >
              All Items ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterMode === 'low' && styles.filterPillActive,
            ]}
            onPress={() => setFilterMode('low')}
          >
            <Text
              style={[
                styles.filterText,
                filterMode === 'low' && styles.filterTextActive,
              ]}
            >
              Low Stock ({lowStockCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Items List */}
        <View style={styles.listContainer}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search or add a new stock item.
              </Text>
            </View>
          ) : (
            filteredProducts.map((p) => {
              const isLow = (p.quantity_in_stock || 0) <= lowStockThreshold;
              return (
                <View key={p.id} style={styles.itemCard}>
                  {/* Left Column: Details */}
                  <View style={styles.itemLeft}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.catBadge}>{p.category || 'General'}</Text>
                      {p.barcode ? (
                        <Text style={styles.barcodeText}>SKU: {p.barcode}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemName}>{p.name}</Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(p.price)}
                    </Text>
                  </View>

                  {/* Right Column: Stock & Adjust Stepper */}
                  <View style={styles.itemRight}>
                    <View
                      style={[
                        styles.stockStatusBadge,
                        isLow
                          ? styles.stockStatusLow
                          : styles.stockStatusOk,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockStatusText,
                          isLow ? styles.textWarning : styles.textSuccess,
                        ]}
                      >
                        {p.quantity_in_stock || 0} in stock
                      </Text>
                    </View>

                    <View style={styles.adjustRow}>
                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => onAdjustStock(p.id, -1)}
                      >
                        <Ionicons
                          name="remove"
                          size={16}
                          color={colors.text}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => onAdjustStock(p.id, 1)}
                      >
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => handleDelete(p)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 46,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    justifyContent: 'center',
    height: 46,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: spacing.sm,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  catBadge: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  barcodeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    color: colors.cashTender,
    fontSize: 15,
    fontWeight: '800',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  stockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  stockStatusOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  stockStatusLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSuccess: {
    color: colors.success,
  },
  textWarning: {
    color: colors.warning,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
