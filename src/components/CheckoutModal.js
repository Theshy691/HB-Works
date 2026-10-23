// HB Works POS - Checkout & Payment Tender Modal
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, formatCurrency, CURRENCY_SYMBOL } from '../theme';

export default function CheckoutModal({
  visible,
  total,
  onClose,
  onCompleteSale,
}) {
  const [payMethod, setPayMethod] = useState('Cash');
  const [tenderedInput, setTenderedInput] = useState('');

  useEffect(() => {
    if (visible) {
      setPayMethod('Cash');
      setTenderedInput(total > 0 ? String(total) : '');
    }
  }, [visible, total]);

  const tenderedAmount = parseFloat(tenderedInput) || 0;
  const changeDue = Math.max(0, tenderedAmount - total);
  const isShort = tenderedAmount < total && payMethod === 'Cash';

  const quickTenderOptions = [
    { label: 'Exact', amount: total },
    { label: '₱100', amount: 100 },
    { label: '₱200', amount: 200 },
    { label: '₱500', amount: 500 },
    { label: '₱1,000', amount: 1000 },
    { label: '₱2,000', amount: 2000 },
  ];

  const handleQuickTender = (amt) => {
    setTenderedInput(String(amt));
  };

  const handleSubmit = () => {
    if (isShort) return;
    onCompleteSale({
      total,
      payMethod,
      tendered: payMethod === 'Cash' ? tenderedAmount : total,
      change: payMethod === 'Cash' ? changeDue : 0,
    });
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
        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetDragBar} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Payment Checkout</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Total Due Banner */}
            <View style={styles.totalBanner}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.methodRow}>
              {['Cash', 'GCash', 'Card'].map((method) => {
                const isSelected = payMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodTab,
                      isSelected && styles.methodTabActive,
                    ]}
                    onPress={() => {
                      setPayMethod(method);
                      if (method !== 'Cash') {
                        setTenderedInput(String(total));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        method === 'Cash'
                          ? 'cash-outline'
                          : method === 'GCash'
                          ? 'phone-portrait-outline'
                          : 'card-outline'
                      }
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        isSelected && styles.methodTextActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cash Tender Interface */}
            {payMethod === 'Cash' && (
              <>
                <Text style={styles.sectionTitle}>Quick Tender (Cash)</Text>
                <View style={styles.quickGrid}>
                  {quickTenderOptions.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.quickBtn,
                        tenderedAmount === opt.amount && styles.quickBtnActive,
                      ]}
                      onPress={() => handleQuickTender(opt.amount)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          tenderedAmount === opt.amount &&
                            styles.quickBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Cash Input */}
                <Text style={styles.sectionTitle}>Custom Cash Tendered</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>{CURRENCY_SYMBOL}</Text>
                  <TextInput
                    style={styles.tenderInput}
                    keyboardType="numeric"
                    value={tenderedInput}
                    onChangeText={setTenderedInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                  {tenderedInput ? (
                    <TouchableOpacity
                      onPress={() => setTenderedInput('')}
                      style={styles.clearInputBtn}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Change Due Card */}
                <View
                  style={[
                    styles.changeCard,
                    isShort ? styles.changeCardShort : styles.changeCardSuccess,
                  ]}
                >
                  <Text style={styles.changeLabel}>
                    {isShort ? 'INSUFFICIENT TENDER' : 'CHANGE DUE'}
                  </Text>
                  <Text
                    style={[
                      styles.changeValue,
                      isShort ? styles.textDanger : styles.textSuccess,
                    ]}
                  >
                    {isShort
                      ? `Need ${formatCurrency(total - tenderedAmount)} more`
                      : formatCurrency(changeDue)}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isShort && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isShort}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                Complete Sale & Print Receipt
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  sheetDragBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  totalBanner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  totalValue: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickBtn: {
    width: '31%',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: colors.success,
  },
  quickBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  quickBtnTextActive: {
    color: colors.success,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    marginBottom: spacing.md,
  },
  currencyPrefix: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 6,
  },
  tenderInput: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  clearInputBtn: {
    padding: spacing.xs,
  },
  changeCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  changeCardSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  changeCardShort: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  changeValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  textSuccess: {
    color: colors.success,
  },
  textDanger: {
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  submitBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: colors.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
