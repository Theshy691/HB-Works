// HB Works POS - Executive Inventory Management Screen
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

  // Inventory analytics
  const { lowStockCount, totalValuation, totalUnits } = useMemo(() => {
    let lowCount = 0;
    let valuation = 0;
    let units = 0;

    products.forEach((p) => {
      const stock = p.quantity_in_stock || 0;
      if (stock <= lowStockThreshold) lowCount += 1;
      valuation += (p.price || 0) * stock;
      units += stock;
    });

    return {
      lowStockCount: lowCount,
      totalValuation: valuation,
      totalUnits: units,
    };
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
    const confirmMessage = `Are you sure you want to delete "${product.name}" from inventory?`;
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
        {/* KPI Summary Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL SKUs</Text>
            <Text style={styles.kpiValue}>{products.length}</Text>
            <Text style={styles.kpiSub}>{totalUnits} total units</Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              lowStockCount > 0 && styles.kpiCardWarning,
            ]}
          >
            <View style={styles.kpiRowHeader}>
              <Text
                style={[
                  styles.kpiLabel,
                  lowStockCount > 0 && { color: colors.warning },
                ]}
              >
                LOW STOCK
              </Text>
              {lowStockCount > 0 && (
                <View style={styles.warningDot} />
              )}
            </View>
            <Text
              style={[
                styles.kpiValue,
                lowStockCount > 0 && { color: colors.warning },
              ]}
            >
              {lowStockCount}
            </Text>
            <Text style={styles.kpiSub}>Threshold: ≤ 10 units</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>INVENTORY VALUE</Text>
            <Text style={styles.kpiValueValuation}>
              {formatCurrency(totalValuation)}
            </Text>
            <Text style={styles.kpiSub}>Retail value</Text>
          </View>
        </View>

        {/* Controls: Search & Receive Stock CTA */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by SKU, barcode, name..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.receiveBtn}
            onPress={onOpenReceiveStock}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.receiveBtnText}>Receive Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Segment Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterMode === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.7}
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
              filterMode === 'low' && styles.filterPillActiveWarning,
            ]}
            onPress={() => setFilterMode('low')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="warning-outline"
              size={13}
              color={filterMode === 'low' ? '#FFFFFF' : colors.warning}
            />
            <Text
              style={[
                styles.filterText,
                filterMode === 'low' && styles.filterTextActive,
                filterMode !== 'low' && { color: colors.warning },
              ]}
            >
              Low Stock Alerts ({lowStockCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Items List */}
        <View style={styles.listContainer}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or tap "+ Receive Stock" to create a new item.
              </Text>
            </View>
          ) : (
            filteredProducts.map((p) => {
              const stock = p.quantity_in_stock || 0;
              const isLow = stock <= lowStockThreshold;

              return (
                <View key={p.id} style={styles.itemCard}>
                  {/* Left Column: Details */}
                  <View style={styles.itemLeft}>
                    <View style={styles.badgeRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>
                          {p.category || 'General'}
                        </Text>
                      </View>
                      {p.barcode ? (
                        <View style={styles.barcodeBadge}>
                          <Ionicons
                            name="barcode-outline"
                            size={12}
                            color={colors.textMuted}
                          />
                          <Text style={styles.barcodeText}>{p.barcode}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.itemName} numberOfLines={2}>
                      {p.name}
                    </Text>

                    <Text style={styles.itemPrice}>
                      {formatCurrency(p.price)}
                    </Text>
                  </View>

                  {/* Right Column: Stock Status & Fast Stepper */}
                  <View style={styles.itemRight}>
                    <View
                      style={[
                        styles.stockStatusBadge,
                        isLow
                          ? styles.stockStatusLow
                          : styles.stockStatusOk,
                      ]}
                    >
                      <View
                        style={[
                          styles.stockDot,
                          {
                            backgroundColor: isLow
                              ? colors.warning
                              : colors.success,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stockStatusText,
                          isLow
                            ? styles.stockStatusTextLow
                            : styles.stockStatusTextOk,
                        ]}
                      >
                        {stock} in stock {isLow ? '• LOW' : ''}
                      </Text>
                    </View>

                    {/* Stock Stepper */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onAdjustStock(p.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={15} color={colors.text} />
                      </TouchableOpacity>

                      <View style={styles.stepperValueBox}>
                        <Text style={styles.stepperValue}>{stock}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onAdjustStock(p.id, 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={15} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Delete Action */}
                    <TouchableOpacity
                      onPress={() => handleDelete(p)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color={colors.textDim}
                      />
                    </TouchableOpacity>
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
    padding: spacing.lg,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  kpiCardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  kpiRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  kpiValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginVertical: 2,
  },
  kpiValueValuation: {
    color: colors.cashTender,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginVertical: 5,
  },
  kpiSub: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    height: '100%',
  },
  receiveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  receiveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderLight,
  },
  filterPillActiveWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: colors.warning,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.text,
  },
  listContainer: {
    gap: 10,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemLeft: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  barcodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  barcodeText: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  itemPrice: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  stockStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  stockStatusOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  stockStatusLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stockStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stockStatusTextOk: {
    color: colors.success,
  },
  stockStatusTextLow: {
    color: colors.warning,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    minWidth: 26,
    alignItems: 'center',
  },
  stepperValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 3,
    marginTop: -2,
  },
});
