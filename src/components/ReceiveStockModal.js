// HB Works POS - Add or Receive Stock Modal
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, CURRENCY_SYMBOL } from '../theme';

export default function ReceiveStockModal({
  visible,
  initialBarcode,
  onClose,
  onSaveProduct,
  onOpenScanner,
}) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Maintenance');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');

  useEffect(() => {
    if (visible) {
      setBarcode(initialBarcode || '');
      setName('');
      setPrice('');
      setStock('10');
      setCategory('Maintenance');
    }
  }, [visible, initialBarcode]);

  const categories = [
    'Maintenance',
    'Oil & Fluids',
    'Brakes',
    'Tires',
    'Ignition',
    'Drive',
    'Accessories',
  ];

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedBarcode = barcode.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const parsedPrice = parseFloat(price) || 0;
    const parsedStock = parseInt(stock, 10) || 0;

    if (!trimmedName) {
      if (Platform.OS === 'web') {
        alert('Please enter a product name');
      } else {
        Alert.alert('Validation Error', 'Please enter a product name');
      }
      return;
    }

    onSaveProduct({
      id: `p-${Date.now()}`,
      name: trimmedName,
      barcode: trimmedBarcode,
      price: parsedPrice,
      quantity_in_stock: parsedStock,
      category,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Receive / Add Product</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Barcode / SKU with scan button */}
            <Text style={styles.label}>Barcode / SKU</Text>
            <View style={styles.barcodeRow}>
              <TextInput
                style={[styles.input, styles.barcodeInput]}
                placeholder="Scan or enter barcode..."
                placeholderTextColor={colors.textMuted}
                value={barcode}
                onChangeText={setBarcode}
              />
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => {
                  onClose();
                  onOpenScanner();
                }}
              >
                <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Product Name */}
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Motul 7100 10W40 1L"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Category selection */}
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    category === cat && styles.catChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Price & Quantity Row */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Selling Price ({CURRENCY_SYMBOL})</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Product to Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    minHeight: 48,
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barcodeInput: {
    flex: 1,
  },
  scanBtn: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
