// HB Works POS - Executive Sales & Income Analytics Screen
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
  // Aggregate Analytics
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    let todayRevenue = 0;
    let todayOrders = 0;
    let todayItemsSold = 0;
    let cashVolume = 0;
    let digitalVolume = 0;

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.timestamp).toDateString();
      if (txnDate === today) {
        todayRevenue += txn.total || 0;
        todayOrders += 1;
        todayItemsSold += txn.itemsCount || 1;

        if (txn.payMethod === 'Cash') {
          cashVolume += txn.total || 0;
        } else {
          digitalVolume += txn.total || 0;
        }
      }
    });

    const avgTicket = todayOrders > 0 ? todayRevenue / todayOrders : 0;

    return {
      revenue: todayRevenue,
      orders: todayOrders,
      itemsSold: todayItemsSold,
      avgTicket,
      cashVolume,
      digitalVolume,
    };
  }, [transactions]);

  const handleClear = () => {
    const msg = 'Are you sure you want to reset today\'s transaction history?';
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
        {/* Today's Gross Revenue Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.heroBadgeText}>LIVE SALES FEED</Text>
            </View>
            <Text style={styles.todayDateText}>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          <Text style={styles.heroLabel}>TODAY'S GROSS REVENUE</Text>
          <Text style={styles.heroAmount}>{formatCurrency(stats.revenue)}</Text>

          {/* Metric Trio */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{stats.orders}</Text>
              <Text style={styles.metricLbl}>Orders</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{stats.itemsSold}</Text>
              <Text style={styles.metricLbl}>Units Sold</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>
                {formatCurrency(stats.avgTicket)}
              </Text>
              <Text style={styles.metricLbl}>Avg Ticket</Text>
            </View>
          </View>
        </View>

        {/* Payment Volume Split */}
        <View style={styles.splitCard}>
          <View style={styles.splitCol}>
            <View style={styles.splitTitleRow}>
              <Ionicons name="cash-outline" size={14} color={colors.cashTender} />
              <Text style={styles.splitLbl}>Cash Tendered</Text>
            </View>
            <Text style={styles.splitVal}>{formatCurrency(stats.cashVolume)}</Text>
          </View>

          <View style={styles.splitDivider} />

          <View style={styles.splitCol}>
            <View style={styles.splitTitleRow}>
              <Ionicons name="phone-portrait-outline" size={14} color={colors.info} />
              <Text style={styles.splitLbl}>GCash / Card</Text>
            </View>
            <Text style={styles.splitVal}>{formatCurrency(stats.digitalVolume)}</Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              Completed Transactions ({transactions.length})
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
            <Ionicons name="receipt-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions recorded today</Text>
            <Text style={styles.emptySub}>
              Completed sales from the register will appear here in real-time.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((txn) => {
              const formattedTime = new Date(txn.timestamp).toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );

              return (
                <View key={txn.id} style={styles.txnCard}>
                  {/* Top info */}
                  <View style={styles.txnTop}>
                    <View style={styles.txnIdBadge}>
                      <Ionicons
                        name="barcode-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.txnIdText}>{txn.id}</Text>
                    </View>

                    <View
                      style={[
                        styles.payBadge,
                        txn.payMethod === 'Cash'
                          ? styles.payCash
                          : styles.payDigital,
                      ]}
                    >
                      <Text
                        style={[
                          styles.payText,
                          txn.payMethod === 'Cash'
                            ? styles.payCashText
                            : styles.payDigitalText,
                        ]}
                      >
                        {txn.payMethod || 'Cash'}
                      </Text>
                    </View>
                  </View>

                  {/* Middle content */}
                  <View style={styles.txnMiddle}>
                    <View style={styles.txnMetaCol}>
                      <Text style={styles.txnAmount}>
                        {formatCurrency(txn.total)}
                      </Text>
                      <Text style={styles.txnSubMeta}>
                        {txn.itemsCount || 1} {txn.itemsCount === 1 ? 'item' : 'items'} • {formattedTime}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.viewReceiptBtn}
                      onPress={() => onViewReceipt(txn)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="print-outline"
                        size={15}
                        color={colors.text}
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
    padding: spacing.lg,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    padding: 16,
    marginBottom: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 5,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  heroBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  todayDateText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroAmount: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  metricLbl: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '70%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  splitCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitCol: {
    flex: 1,
    gap: 3,
  },
  splitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  splitLbl: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  splitVal: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  splitDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearBtnText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 8,
  },
  txnCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  txnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txnIdText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  payBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payCash: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  payDigital: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  payText: {
    fontSize: 10,
    fontWeight: '800',
  },
  payCashText: {
    color: colors.cashTender,
  },
  payDigitalText: {
    color: colors.info,
  },
  txnMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnMetaCol: {
    gap: 2,
  },
  txnAmount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  txnSubMeta: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  viewReceiptText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
