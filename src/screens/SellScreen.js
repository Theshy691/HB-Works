// HB Works POS - Executive Register & Sell Screen
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, formatCurrency } from '../theme';

export default function SellScreen({
  products,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onOpenScanner,
  onProceedCheckout,
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const totalCartUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.cart_quantity || 1), 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.cart_quantity || 1),
      0
    );
  }, [cart]);

  const cartTotal = cartSubtotal; // 0% tax

  // Quick lookup of in-cart quantity by product id
  const cartQtyMap = useMemo(() => {
    const map = {};
    cart.forEach((c) => {
      map[c.id] = c.cart_quantity || 1;
    });
    return map;
  }, [cart]);

  const handleQuickAddSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;

    // Search exact barcode or name
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === q.toLowerCase())
    );

    if (found) {
      onAddToCart(found);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      onAddToCart(filteredProducts[0]);
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Camera Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search parts, oil, tires or scan barcode..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleQuickAddSubmit}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.cameraScanBtn}
          onPress={onOpenScanner}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
          <Text style={styles.cameraScanBtnText}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills Strip */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, isSelected && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.catPillText,
                    isSelected && styles.catPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product Catalog Grid */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          cart.length > 0 && { paddingBottom: 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridHeaderRow}>
          <Text style={styles.gridHeaderTitle}>
            {selectedCategory.toUpperCase()} ({filteredProducts.length})
          </Text>
          <Text style={styles.gridHeaderSub}>Tap item to add to register</Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptySearchCard}>
            <Ionicons name="search-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptySearchTitle}>No matching items found</Text>
            <Text style={styles.emptySearchSub}>
              Scan barcode or check spelling to locate item
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredProducts.map((product) => {
              const inStock = product.quantity_in_stock ?? 0;
              const isLowStock = inStock <= 10;
              const inCartQty = cartQtyMap[product.id] || 0;

              return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    inCartQty > 0 && styles.productCardInCart,
                  ]}
                  onPress={() => onAddToCart(product)}
                  activeOpacity={0.75}
                >
                  {/* Top tags row */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.categoryTag} numberOfLines={1}>
                      {product.category || 'General'}
                    </Text>

                    <View
                      style={[
                        styles.stockBadge,
                        isLowStock
                          ? styles.stockBadgeLow
                          : styles.stockBadgeOk,
                      ]}
                    >
                      <View
                        style={[
                          styles.stockDot,
                          {
                            backgroundColor: isLowStock
                              ? colors.warning
                              : colors.success,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stockBadgeText,
                          isLowStock
                            ? styles.stockBadgeTextLow
                            : styles.stockBadgeTextOk,
                        ]}
                      >
                        {inStock}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  {/* Price & Quick Add Button */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.productPrice}>
                      {formatCurrency(product.price)}
                    </Text>

                    {inCartQty > 0 ? (
                      <View style={styles.inCartIndicator}>
                        <Text style={styles.inCartQtyText}>×{inCartQty}</Text>
                      </View>
                    ) : (
                      <View style={styles.addBtnCircle}>
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Order Drawer Bar */}
      {cart.length > 0 && (
        <View style={styles.floatingBarWrapper}>
          <View style={styles.floatingBarCard}>
            <TouchableOpacity
              style={styles.floatingOrderInfo}
              onPress={() => setIsCartSheetOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.orderBadgeCircle}>
                <Ionicons name="receipt" size={16} color={colors.primary} />
              </View>
              <View style={styles.orderMetaCol}>
                <Text style={styles.orderUnitsText}>
                  {totalCartUnits} {totalCartUnits === 1 ? 'ITEM' : 'ITEMS'} IN REGISTER
                </Text>
                <Text style={styles.orderTotalAmount}>
                  {formatCurrency(cartTotal)}
                </Text>
              </View>
              <Ionicons
                name="chevron-up"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chargeBtn}
              onPress={onProceedCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.chargeBtnText}>CHARGE</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Interactive Cart Sheet Modal */}
      <Modal
        visible={isCartSheetOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCartSheetOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetDragBar} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Ionicons name="cart" size={20} color={colors.primary} />
                <Text style={styles.sheetTitle}>Current Register Order</Text>
                <View style={styles.sheetCountTag}>
                  <Text style={styles.sheetCountTagText}>
                    {totalCartUnits} {totalCartUnits === 1 ? 'unit' : 'units'}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetActionsRow}>
                <TouchableOpacity
                  onPress={onClearCart}
                  style={styles.clearBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsCartSheetOpen(false)}
                  style={styles.closeSheetBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Items List */}
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => {
                const lineTotal = (item.price || 0) * (item.cart_quantity || 1);
                return (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={styles.itemMetaCol}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemUnitPrice}>
                        {formatCurrency(item.price)} each
                      </Text>
                    </View>

                    {/* Stepper */}
                    <View style={styles.stepperBox}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => onUpdateCartQty(item.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </TouchableOpacity>

                      <Text style={styles.stepCount}>
                        {item.cart_quantity || 1}
                      </Text>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => onUpdateCartQty(item.id, 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Line Total */}
                    <Text style={styles.itemLineTotal}>
                      {formatCurrency(lineTotal)}
                    </Text>

                    {/* Delete Item */}
                    <TouchableOpacity
                      onPress={() => onRemoveCartItem(item.id)}
                      style={styles.itemDeleteBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Order Calculation Card */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLbl}>Subtotal</Text>
                  <Text style={styles.breakdownVal}>
                    {formatCurrency(cartSubtotal)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLbl}>VAT / Tax (0%)</Text>
                  <Text style={styles.breakdownVal}>₱0.00</Text>
                </View>
                <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                  <Text style={styles.totalLbl}>Total Amount</Text>
                  <Text style={styles.totalVal}>
                    {formatCurrency(cartTotal)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Checkout Bar */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.sheetCheckoutBtn}
                onPress={() => {
                  setIsCartSheetOpen(false);
                  onProceedCheckout();
                }}
                activeOpacity={0.85}
              >
                <View style={styles.sheetCheckoutLeft}>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.sheetCheckoutText}>
                    Charge {formatCurrency(cartTotal)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
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
  clearSearchBtn: {
    padding: 4,
  },
  cameraScanBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  cameraScanBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  categoryContainer: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryContent: {
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  catPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 4,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 12,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridHeaderTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gridHeaderSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  productCard: {
    width: '48.2%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  productCardInCart: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryTag: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 4,
  },
  stockBadgeOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stockBadgeTextOk: {
    color: colors.success,
  },
  stockBadgeTextLow: {
    color: colors.warning,
  },
  productName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  addBtnCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inCartIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  inCartQtyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  emptySearchCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptySearchTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySearchSub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  floatingBarWrapper: {
    position: 'absolute',
    bottom: 12,
    left: spacing.md,
    right: spacing.md,
    zIndex: 99,
  },
  floatingBarCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  floatingOrderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  orderBadgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderMetaCol: {
    flex: 1,
  },
  orderUnitsText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  orderTotalAmount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chargeBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  chargeBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  sheetDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDim,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sheetCountTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  sheetCountTagText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  closeSheetBtn: {
    padding: 4,
  },
  sheetScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  itemMetaCol: {
    flex: 1,
  },
  itemName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  itemUnitPrice: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    gap: 4,
  },
  stepBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  stepCount: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  itemLineTotal: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 65,
    textAlign: 'right',
  },
  itemDeleteBtn: {
    padding: 4,
  },
  breakdownCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLbl: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownVal: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 2,
  },
  totalLbl: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  totalVal: {
    color: colors.cashTender,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },
  sheetCheckoutBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  sheetCheckoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetCheckoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
