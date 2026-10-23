// HB Works POS - Income & Sales Analytics Screen
import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, formatCurrency } from '../theme';

export default function IncomeScreen({
  transactions,
  onViewReceipt,
  onClearTransactions,
}) {
  // Aggregate KPIs
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    let todayRevenue = 0;
    let todayOrders = 0;
    let todayItemsSold = 0;

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.timestamp).toDateString();
      if (txnDate === today) {
        todayRevenue += txn.total || 0;
        todayOrders += 1;
        todayItemsSold += txn.itemsCount || 1;
      }
    });

    const avgTicket = todayOrders > 0 ? todayRevenue / todayOrders : 0;

    return {
      revenue: todayRevenue,
      orders: todayOrders,
      itemsSold: todayItemsSold,
      avgTicket,
    };
  }, [transactions]);

  const handleClear = () => {
    const msg = 'Are you sure you want to reset recent transaction history?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        onClearTransactions();
      }
    } else {
      Alert.alert('Reset Transactions', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onClearTransactions },
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
        {/* Today's Revenue Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSub}>TODAY'S TOTAL REVENUE</Text>
          <Text style={styles.heroAmount}>{formatCurrency(stats.revenue)}</Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiVal}>{stats.orders}</Text>
              <Text style={styles.kpiLbl}>Orders</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiVal}>{stats.itemsSold}</Text>
              <Text style={styles.kpiLbl}>Items Sold</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiVal}>{formatCurrency(stats.avgTicket)}</Text>
              <Text style={styles.kpiLbl}>Avg Ticket</Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              Recent Transactions ({transactions.length})
            </Text>
          </View>
          {transactions.length > 0 && (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Reset History</Text>
            </TouchableOpacity>
          )}
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="cash-outline"
              size={44}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No transactions recorded</Text>
            <Text style={styles.emptySub}>
              Completed sales will appear here with full receipt details.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((txn) => {
              const formattedTime = new Date(
                txn.timestamp
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <View key={txn.id} style={styles.txnCard}>
                  <View style={styles.txnTop}>
                    <View style={styles.txnIdBadge}>
                      <Text style={styles.txnIdText}>{txn.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.payBadge,
                        txn.payMethod === 'Cash'
                          ? styles.payCash
                          : styles.payEwallet,
                      ]}
                    >
                      <Text
                        style={[
                          styles.payText,
                          txn.payMethod === 'Cash'
                            ? styles.payCashText
                            : styles.payEwalletText,
                        ]}
                      >
                        {txn.payMethod || 'Cash'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txnMiddle}>
                    <View>
                      <Text style={styles.txnAmount}>
                        {formatCurrency(txn.total)}
                      </Text>
                      <Text style={styles.txnMeta}>
                        {txn.itemsCount || 1} items • {formattedTime}
                      </Text>
                    </View>

                    {/* View Receipt Button */}
                    <TouchableOpacity
                      style={styles.viewReceiptBtn}
                      onPress={() => onViewReceipt(txn)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="newspaper-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.viewReceiptText}>Receipt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroAmount: {
    color: colors.cashTender,
    fontSize: 36,
    fontWeight: '900',
    marginVertical: spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  kpiVal: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  kpiLbl: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  clearBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
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
  transactionsList: {
    gap: spacing.sm,
  },
  txnCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnIdBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  txnIdText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  payBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  payCash: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  payEwallet: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  payText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payCashText: {
    color: colors.success,
  },
  payEwalletText: {
    color: colors.primary,
  },
  txnMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnAmount: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  txnMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  viewReceiptBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  viewReceiptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
