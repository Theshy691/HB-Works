// HB Works POS - Sell & POS Screen
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
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
  const cartSubtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.cart_quantity || 1),
      0
    );
  }, [cart]);

  const cartTotal = cartSubtotal; // 0% tax

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
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Scan & Search Bar */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.cameraScanBtn}
            onPress={onOpenScanner}
            activeOpacity={0.8}
          >
            <Ionicons name="scan-outline" size={22} color="#FFFFFF" />
            <Text style={styles.cameraScanBtnText}>Camera Scan</Text>
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search or barcode..."
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
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
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

        {/* Quick POS Products Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Quick Catalog ({filteredProducts.length})
          </Text>
          <Text style={styles.sectionSubtitle}>⚡ Tap to add to cart</Text>
        </View>

        <View style={styles.gridContainer}>
          {filteredProducts.map((product) => {
            const isLowStock = (product.quantity_in_stock || 0) <= 10;
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => onAddToCart(product)}
                activeOpacity={0.75}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.categoryBadge} numberOfLines={1}>
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
                    <Text
                      style={[
                        styles.stockBadgeText,
                        isLowStock
                          ? styles.stockBadgeTextLow
                          : styles.stockBadgeTextOk,
                      ]}
                    >
                      {product.quantity_in_stock ?? 0} in stock
                    </Text>
                  </View>
                </View>

                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.productPrice}>
                    {formatCurrency(product.price)}
                  </Text>
                  <View style={styles.addIconCircle}>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Current Cart Section */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeaderRow}>
            <View style={styles.cartTitleRow}>
              <Ionicons name="cart" size={20} color={colors.primary} />
              <Text style={styles.cartSectionTitle}>
                Current Cart ({cart.length})
              </Text>
            </View>
            {cart.length > 0 && (
              <TouchableOpacity onPress={onClearCart} activeOpacity={0.7}>
                <Text style={styles.clearCartText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCartCard}>
              <Ionicons
                name="cart-outline"
                size={44}
                color={colors.textMuted}
              />
              <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
              <Text style={styles.emptyCartSub}>
                Tap any product above or scan barcode to begin
              </Text>
            </View>
          ) : (
            <View style={styles.cartItemsList}>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItemCard}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemUnit}>
                      {formatCurrency(item.price)} each
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => onUpdateCartQty(item.id, -1)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    <Text style={styles.stepperCount}>
                      {item.cart_quantity || 1}
                    </Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => onUpdateCartQty(item.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Item Subtotal */}
                  <Text style={styles.cartItemSubtotal}>
                    {formatCurrency(
                      (item.price || 0) * (item.cart_quantity || 1)
                    )}
                  </Text>

                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => onRemoveCartItem(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Cart Summary Card */}
              <View style={styles.cartSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(cartSubtotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax (0%)</Text>
                  <Text style={styles.summaryValue}>₱0.00</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Due</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(cartTotal)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Checkout Button Bar */}
      {cart.length > 0 && (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={onProceedCheckout}
            activeOpacity={0.85}
          >
            <View style={styles.checkoutBtnLeft}>
              <Ionicons name="card" size={22} color="#FFFFFF" />
              <Text style={styles.checkoutBtnTitle}>Proceed to Payment</Text>
            </View>
            <Text style={styles.checkoutBtnAmount}>
              {formatCurrency(cartTotal)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 90,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cameraScanBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  cameraScanBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  categoryScroll: {
    marginBottom: spacing.md,
  },
  categoryContent: {
    gap: spacing.xs,
  },
  catPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  productCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 128,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  stockBadgeOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stockBadgeTextOk: {
    color: colors.success,
  },
  stockBadgeTextLow: {
    color: colors.warning,
  },
  productName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    color: colors.cashTender,
    fontSize: 16,
    fontWeight: '800',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  clearCartText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCartCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyCartTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptyCartSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  cartItemsList: {
    gap: spacing.sm,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  cartItemUnit: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperCount: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
  },
  cartItemSubtotal: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    minWidth: 64,
    textAlign: 'right',
  },
  deleteBtn: {
    padding: 4,
  },
  cartSummaryCard: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  floatingBar: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  checkoutBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  checkoutBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkoutBtnTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  checkoutBtnAmount: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
});
