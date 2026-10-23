// HB Works POS - Thermal Paper Receipt Preview Modal
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, formatCurrency } from '../theme';

export default function ReceiptModal({
  visible,
  sale,
  onClose,
  storeSettings,
}) {
  if (!visible || !sale) return null;

  const storeName = storeSettings?.storeName || 'HB WORKS MOTOR SHOP';
  const storeAddress = storeSettings?.storeAddress || 'Taguig City, Philippines';
  const formattedDate = new Date(sale.timestamp || Date.now()).toLocaleString();

  const handleShareOrPrint = async () => {
    try {
      const itemsText = (sale.items || [])
        .map(
          (item) =>
            `${item.quantity || 1}x ${item.name} - ${formatCurrency(
              (item.price || 0) * (item.quantity || 1)
            )}`
        )
        .join('\n');

      const receiptText = `
================================
     ${storeName}
     ${storeAddress}
================================
Receipt: ${sale.id}
Date: ${formattedDate}
Payment: ${sale.payMethod || 'Cash'}
--------------------------------
${itemsText}
--------------------------------
TOTAL DUE:      ${formatCurrency(sale.total)}
TENDERED:       ${formatCurrency(sale.tendered || sale.total)}
CHANGE:         ${formatCurrency(sale.change || 0)}
================================
  Thank you for your business!
================================
      `;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.print?.();
      } else {
        await Share.share({
          message: receiptText,
          title: `Receipt ${sale.id}`,
        });
      }
    } catch (err) {
      console.warn('Error sharing receipt:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Action Bar */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Customer Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Thermal Paper Receipt Body */}
          <ScrollView style={styles.paperScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.paper}>
              {/* Receipt Header */}
              <View style={styles.paperCenter}>
                <Image
                  source={require('../../assets/hb-logo.png')}
                  style={styles.receiptLogo}
                  resizeMode="contain"
                />
                <Text style={styles.receiptBrand}>{storeName}</Text>
                <Text style={styles.receiptSubtext}>{storeAddress}</Text>
                <Text style={styles.receiptSubtext}>Tel: (02) 8888-MOTOR</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Transaction Metadata */}
              <View style={styles.metaRow}>
                <Text style={styles.receiptLabel}>Receipt #:</Text>
                <Text style={styles.receiptMono}>{sale.id}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.receiptLabel}>Date & Time:</Text>
                <Text style={styles.receiptMono}>{formattedDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.receiptLabel}>Payment:</Text>
                <Text style={styles.receiptMono}>{sale.payMethod || 'Cash'}</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Items List */}
              <View style={styles.itemsHeader}>
                <Text style={[styles.colQty, styles.bold]}>QTY</Text>
                <Text style={[styles.colDesc, styles.bold]}>ITEM</Text>
                <Text style={[styles.colTotal, styles.bold]}>TOTAL</Text>
              </View>

              {(sale.items || []).map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.colQty}>{item.quantity || 1}</Text>
                  <View style={styles.colDesc}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnit}>
                      @{formatCurrency(item.price)}
                    </Text>
                  </View>
                  <Text style={styles.colTotal}>
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </Text>
                </View>
              ))}

              <View style={styles.dashedDivider} />

              {/* Totals Section */}
              <View style={styles.totalRow}>
                <Text style={styles.receiptLabel}>SUBTOTAL</Text>
                <Text style={styles.receiptMono}>{formatCurrency(sale.total)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.receiptLabel}>TAX (0%)</Text>
                <Text style={styles.receiptMono}>₱0.00</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TOTAL DUE</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(sale.total)}</Text>
              </View>

              <View style={styles.dashedDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.receiptLabel}>AMOUNT TENDERED</Text>
                <Text style={styles.receiptMono}>
                  {formatCurrency(sale.tendered || sale.total)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.receiptLabel}>CHANGE DUE</Text>
                <Text style={[styles.receiptMono, styles.bold]}>
                  {formatCurrency(sale.change || 0)}
                </Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Footer barcode visual */}
              <View style={styles.paperCenter}>
                <Ionicons name="barcode" size={48} color="#1F2937" />
                <Text style={styles.barcodeNum}>{sale.id}</Text>
                <Text style={styles.footerThanks}>THANK YOU FOR YOUR BUSINESS!</Text>
                <Text style={styles.receiptSubtext}>Please keep for warranty / exchange</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareOrPrint}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={20} color="#FFFFFF" />
              <Text style={styles.btnText}>Print / Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newSaleBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.btnText}>New Sale</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  paperScroll: {
    marginVertical: spacing.md,
  },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  paperCenter: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  receiptLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 6,
  },
  receiptBrand: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },
  receiptSubtext: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
    textAlign: 'center',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    marginVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  receiptMono: {
    fontSize: 12,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemsHeader: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  colQty: {
    width: 32,
    fontSize: 12,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  colDesc: {
    flex: 1,
  },
  colTotal: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemName: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemUnit: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  grandTotalRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: '#111827',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  barcodeNum: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#111827',
    letterSpacing: 2,
    marginVertical: 2,
  },
  footerThanks: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  bold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newSaleBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
