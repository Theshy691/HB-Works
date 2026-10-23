// HB Works POS - Supabase Database & Store Settings Modal
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { testConnection } from '../services/supabase';

export default function SupabaseSettingsModal({
  visible,
  settings,
  offlineQueueCount,
  onClose,
  onSaveSettings,
  onSyncNow,
}) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [storeName, setStoreName] = useState('HB WORKS MOTOR SHOP');
  const [storeAddress, setStoreAddress] = useState('Taguig City, Philippines');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (visible && settings) {
      setUrl(settings.supabaseUrl || '');
      setKey(settings.supabaseKey || '');
      setStoreName(settings.storeName || 'HB WORKS MOTOR SHOP');
      setStoreAddress(settings.storeAddress || 'Taguig City, Philippines');
      setTestResult(null);
    }
  }, [visible, settings]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testConnection(url.trim(), key.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    onSaveSettings({
      supabaseUrl: url.trim(),
      supabaseKey: key.trim(),
      storeName: storeName.trim(),
      storeAddress: storeAddress.trim(),
      soundEnabled: settings.soundEnabled ?? true,
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
            <View style={styles.headerTitleRow}>
              <Ionicons name="cloud" size={22} color={colors.primary} />
              <Text style={styles.title}>Cloud Database & Store Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Offline Queue Status Pill */}
            <View style={styles.queueCard}>
              <View style={styles.queueLeft}>
                <Ionicons
                  name={
                    offlineQueueCount > 0
                      ? 'cloud-offline-outline'
                      : 'cloud-done-outline'
                  }
                  size={24}
                  color={offlineQueueCount > 0 ? colors.warning : colors.success}
                />
                <View>
                  <Text style={styles.queueTitle}>
                    {offlineQueueCount > 0
                      ? `${offlineQueueCount} Sales Pending Cloud Sync`
                      : 'All Local Sales Synced to Cloud'}
                  </Text>
                  <Text style={styles.queueSub}>
                    Automatic offline caching & auto-sync
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.syncBtn}
                onPress={() => onSyncNow()}
                activeOpacity={0.7}
              >
                <Ionicons name="sync" size={16} color="#FFFFFF" />
                <Text style={styles.syncBtnText}>Sync</Text>
              </TouchableOpacity>
            </View>

            {/* Supabase URL */}
            <Text style={styles.label}>Supabase Project URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://xyzcompany.supabase.co"
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Supabase Anon Key */}
            <Text style={styles.label}>Supabase Anon / Publishable Key</Text>
            <TextInput
              style={styles.input}
              placeholder="sb_publishable_..."
              placeholderTextColor={colors.textMuted}
              value={key}
              onChangeText={setKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={true}
            />

            {/* Test Connection Button */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTest}
              disabled={testing}
              activeOpacity={0.7}
            >
              {testing ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={18} color={colors.primary} />
                  <Text style={styles.testBtnText}>Test Connection</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Test Result Message */}
            {testResult && (
              <View
                style={[
                  styles.resultBox,
                  testResult.success
                    ? styles.resultSuccess
                    : styles.resultError,
                ]}
              >
                <Ionicons
                  name={
                    testResult.success
                      ? 'checkmark-circle'
                      : 'alert-circle'
                  }
                  size={18}
                  color={testResult.success ? colors.success : colors.danger}
                />
                <Text
                  style={[
                    styles.resultText,
                    testResult.success ? styles.textSuccess : styles.textDanger,
                  ]}
                >
                  {testResult.message}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Store Receipt Customization */}
            <Text style={styles.sectionHeader}>Receipt Header Details</Text>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Store Name"
              placeholderTextColor={colors.textMuted}
              value={storeName}
              onChangeText={setStoreName}
            />

            <Text style={styles.label}>Store Address / Tagline</Text>
            <TextInput
              style={styles.input}
              placeholder="City, Philippines"
              placeholderTextColor={colors.textMuted}
              value={storeAddress}
              onChangeText={setStoreAddress}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save Settings</Text>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.lg,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  queueTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  queueSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  syncBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
    minHeight: 46,
  },
  testBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  testBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  resultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  textSuccess: {
    color: colors.success,
  },
  textDanger: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
