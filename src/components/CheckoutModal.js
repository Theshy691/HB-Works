// HB Works POS - Executive Cashier & Checkout Tender Modal
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
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetDragBar} />
            <View style={styles.headerRow}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
                <Text style={styles.title}>Counter Checkout</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Amount Due Executive Banner */}
            <View style={styles.totalHeroCard}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionHeader}>PAYMENT TENDER METHOD</Text>
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
                      size={18}
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
                <Text style={styles.sectionHeader}>QUICK BANKNOTE TENDER</Text>
                <View style={styles.quickGrid}>
                  {quickTenderOptions.map((opt, idx) => {
                    const isActive = tenderedAmount === opt.amount;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.quickBtn,
                          isActive && styles.quickBtnActive,
                        ]}
                        onPress={() => handleQuickTender(opt.amount)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quickBtnText,
                            isActive && styles.quickBtnTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Cash Input */}
                <Text style={styles.sectionHeader}>ENTER CASH AMOUNT</Text>
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
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Change Due Callout */}
                <View
                  style={[
                    styles.changeCard,
                    isShort ? styles.changeCardShort : styles.changeCardSuccess,
                  ]}
                >
                  <View style={styles.changeLabelRow}>
                    <Ionicons
                      name={isShort ? 'alert-circle' : 'checkmark-circle'}
                      size={18}
                      color={isShort ? colors.danger : colors.success}
                    />
                    <Text
                      style={[
                        styles.changeLabel,
                        isShort ? styles.textShort : styles.textSuccess,
                      ]}
                    >
                      {isShort ? 'INSUFFICIENT AMOUNT' : 'CHANGE DUE TO CUSTOMER'}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.changeValue,
                      isShort ? styles.textShort : styles.textSuccess,
                    ]}
                  >
                    {isShort
                      ? `Short by ${formatCurrency(total - tenderedAmount)}`
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
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isShort ? 'Enter Tender to Finalize' : 'Complete Transaction & Print'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDim,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
  },
  totalHeroCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  totalValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  methodTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickBtn: {
    width: '31.3%',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnActive: {
    borderColor: colors.cashTender,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  quickBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  quickBtnTextActive: {
    color: colors.cashTender,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  currencyPrefix: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '800',
    marginRight: 6,
  },
  tenderInput: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    height: '100%',
  },
  clearInputBtn: {
    padding: 6,
  },
  changeCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
    gap: 4,
  },
  changeCardSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  changeCardShort: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  changeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  changeValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  textSuccess: {
    color: colors.cashTender,
  },
  textShort: {
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },
  submitBtn: {
    backgroundColor: colors.cashTender,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  submitBtnDisabled: {
    backgroundColor: colors.surfaceLight,
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
