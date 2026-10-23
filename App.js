// HB Works Mobile POS - Root React Native Application
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Design & Themes
import { colors, radius, spacing } from './src/theme';

// State & Storage
import {
  loadStoredData,
  saveProductsToStorage,
  saveTransactionsToStorage,
  saveOfflineQueueToStorage,
  saveSettingsToStorage,
  generateTransactionId,
} from './src/state/posStore';

// Services
import {
  testConnection,
  fetchProducts,
  syncProduct,
  updateStock,
  recordSale,
} from './src/services/supabase';
import { playFeedback } from './src/services/feedback';

// Components
import Header from './src/components/Header';
import BottomTabBar from './src/components/BottomTabBar';
import CameraScannerModal from './src/components/CameraScannerModal';
import CheckoutModal from './src/components/CheckoutModal';
import ReceiptModal from './src/components/ReceiptModal';
import ReceiveStockModal from './src/components/ReceiveStockModal';
import SupabaseSettingsModal from './src/components/SupabaseSettingsModal';

// Screens
import SellScreen from './src/screens/SellScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import IncomeScreen from './src/screens/IncomeScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('sell'); // 'sell' | 'inventory' | 'income'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [settings, setSettings] = useState({
    supabaseUrl: 'https://nxgnarvsggetjlhhsvyw.supabase.co',
    supabaseKey: 'sb_publishable_iMAD-utJJkJOeuxYFGRTBw_YkbyiVGz',
    soundEnabled: true,
    storeName: 'HB WORKS MOTOR SHOP',
    storeAddress: 'Taguig City, Philippines',
  });

  const [isOnline, setIsOnline] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentReceiptSale, setCurrentReceiptSale] = useState(null);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [receiveStockInitialBarcode, setReceiveStockInitialBarcode] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Show Toast helper
  const showToast = useCallback(
    (msg) => {
      setToastMessage(msg);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [toastAnim]
  );

  // 1. Initialize store and Supabase sync on mount
  useEffect(() => {
    async function init() {
      const data = await loadStoredData();
      setProducts(data.products);
      setTransactions(data.transactions);
      setOfflineQueue(data.offlineQueue);
      if (data.settings) setSettings(data.settings);

      // Check cloud connectivity
      if (data.settings?.supabaseUrl && data.settings?.supabaseKey) {
        const res = await testConnection(
          data.settings.supabaseUrl,
          data.settings.supabaseKey
        );
        setIsOnline(res.success);

        if (res.success) {
          // Pull cloud catalog
          const cloudProducts = await fetchProducts(
            data.settings.supabaseUrl,
            data.settings.supabaseKey
          );
          if (cloudProducts && cloudProducts.length > 0) {
            setProducts(cloudProducts);
            saveProductsToStorage(cloudProducts);
          }
        }
      }
    }
    init();
  }, []);

  // 2. Hardware Barcode Gun Keystroke Listener (Fast <50ms buffer)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let buffer = '';
    let lastTime = 0;

    const handleKeyDown = (e) => {
      const target = e.target;
      // If user is actively typing in a normal text input, don't hijack unless Enter is pressed on empty input
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const now = Date.now();
      const diff = now - lastTime;
      lastTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleBarcodeDetected(buffer.trim());
          buffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        if (diff > 80) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handle scanned or entered barcode
  const handleBarcodeDetected = useCallback(
    (code) => {
      if (!code) return;
      const trimmed = String(code).trim().toLowerCase();

      // Find product in local catalog
      const product = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === trimmed) ||
          (p.name && p.name.toLowerCase().includes(trimmed))
      );

      if (product) {
        handleAddToCart(product);
        playFeedback('scan', settings.soundEnabled);
        showToast(`Added: ${product.name}`);
      } else {
        playFeedback('error', settings.soundEnabled);
        showToast(`Not found: ${code}`);

        const promptAdd = () => {
          setReceiveStockInitialBarcode(code);
          setIsReceiveStockOpen(true);
        };

        if (Platform.OS === 'web') {
          if (
            window.confirm(
              `Item "${code}" not found. Would you like to add it to inventory?`
            )
          ) {
            promptAdd();
          }
        } else {
          Alert.alert(
            'Item Not Found',
            `Item "${code}" is not in inventory. Would you like to add it now?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add to Inventory', onPress: promptAdd },
            ]
          );
        }
      }
    },
    [products, settings.soundEnabled, showToast]
  );

  // Cart operations
  const handleAddToCart = useCallback(
    (product) => {
      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(
          (item) => item.id === product.id
        );
        if (existingIndex !== -1) {
          const updated = [...prevCart];
          updated[existingIndex] = {
            ...updated[existingIndex],
            cart_quantity: (updated[existingIndex].cart_quantity || 1) + 1,
          };
          return updated;
        }
        return [...prevCart, { ...product, cart_quantity: 1 }];
      });
      playFeedback('success', settings.soundEnabled);
    },
    [settings.soundEnabled]
  );

  const handleUpdateCartQty = useCallback(
    (productId, delta) => {
      setCart((prevCart) => {
        return prevCart
          .map((item) => {
            if (item.id === productId) {
              const newQty = (item.cart_quantity || 1) + delta;
              return newQty > 0 ? { ...item, cart_quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean);
      });
      playFeedback('scan', settings.soundEnabled);
    },
    [settings.soundEnabled]
  );

  const handleRemoveCartItem = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Complete checkout & record sale
  const handleCompleteSale = useCallback(
    async (tenderInfo) => {
      playFeedback('checkout', settings.soundEnabled);

      const txnId = generateTransactionId();
      const saleRecord = {
        id: txnId,
        timestamp: new Date().toISOString(),
        total: tenderInfo.total,
        payMethod: tenderInfo.payMethod,
        tendered: tenderInfo.tendered,
        change: tenderInfo.change,
        itemsCount: cart.reduce(
          (sum, item) => sum + (item.cart_quantity || 1),
          0
        ),
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.cart_quantity || 1,
          barcode: item.barcode,
        })),
      };

      // 1. Add to transaction history
      const updatedTxns = [saleRecord, ...transactions];
      setTransactions(updatedTxns);
      saveTransactionsToStorage(updatedTxns);

      // 2. Deduct inventory stocks
      const updatedProducts = products.map((p) => {
        const inCart = cart.find((c) => c.id === p.id);
        if (inCart) {
          const newQty = Math.max(
            0,
            (p.quantity_in_stock || 0) - (inCart.cart_quantity || 1)
          );
          if (isOnline) {
            updateStock(settings.supabaseUrl, settings.supabaseKey, p.id, newQty);
          }
          return { ...p, quantity_in_stock: newQty };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveProductsToStorage(updatedProducts);

      // 3. Sync to Supabase or queue offline
      if (isOnline) {
        const ok = await recordSale(
          settings.supabaseUrl,
          settings.supabaseKey,
          saleRecord
        );
        if (!ok) {
          const newQueue = [...offlineQueue, saleRecord];
          setOfflineQueue(newQueue);
          saveOfflineQueueToStorage(newQueue);
        }
      } else {
        const newQueue = [...offlineQueue, saleRecord];
        setOfflineQueue(newQueue);
        saveOfflineQueueToStorage(newQueue);
      }

      // 4. Reset Cart & Show Receipt Modal
      setCart([]);
      setIsCheckoutOpen(false);
      setCurrentReceiptSale(saleRecord);
      setIsReceiptOpen(true);
      showToast(`Sale Complete: ${txnId}`);
    },
    [cart, transactions, products, isOnline, settings, offlineQueue, showToast]
  );

  // Inventory actions
  const handleSaveProduct = useCallback(
    async (newProd) => {
      const updatedProducts = [newProd, ...products];
      setProducts(updatedProducts);
      saveProductsToStorage(updatedProducts);
      showToast(`Added to inventory: ${newProd.name}`);

      if (isOnline) {
        syncProduct(settings.supabaseUrl, settings.supabaseKey, newProd);
      }
    },
    [products, isOnline, settings, showToast]
  );

  const handleAdjustStock = useCallback(
    (productId, delta) => {
      setProducts((prev) => {
        const updated = prev.map((p) => {
          if (p.id === productId) {
            const newStock = Math.max(0, (p.quantity_in_stock || 0) + delta);
            if (isOnline) {
              updateStock(settings.supabaseUrl, settings.supabaseKey, p.id, newStock);
            }
            return { ...p, quantity_in_stock: newStock };
          }
          return p;
        });
        saveProductsToStorage(updated);
        return updated;
      });
    },
    [isOnline, settings]
  );

  const handleDeleteProduct = useCallback(
    (productId) => {
      setProducts((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        saveProductsToStorage(updated);
        return updated;
      });
      showToast('Product removed');
    },
    [showToast]
  );

  // Settings & Sync actions
  const handleSaveSettings = useCallback(
    async (newSettings) => {
      setSettings(newSettings);
      saveSettingsToStorage(newSettings);
      showToast('Settings saved');

      const res = await testConnection(
        newSettings.supabaseUrl,
        newSettings.supabaseKey
      );
      setIsOnline(res.success);
    },
    [showToast]
  );

  const handleSyncNow = useCallback(async () => {
    if (!settings.supabaseUrl || !settings.supabaseKey) {
      showToast('Enter Supabase credentials first');
      return;
    }

    showToast('Syncing with Supabase...');
    const res = await testConnection(settings.supabaseUrl, settings.supabaseKey);
    setIsOnline(res.success);

    if (res.success) {
      // 1. Pull products
      const cloudProducts = await fetchProducts(
        settings.supabaseUrl,
        settings.supabaseKey
      );
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        saveProductsToStorage(cloudProducts);
      }

      // 2. Push offline queue
      if (offlineQueue.length > 0) {
        for (const item of offlineQueue) {
          await recordSale(settings.supabaseUrl, settings.supabaseKey, item);
        }
        setOfflineQueue([]);
        saveOfflineQueueToStorage([]);
      }
      showToast('Database synced successfully!');
    } else {
      showToast('Sync failed: Could not connect');
    }
  }, [settings, offlineQueue, showToast]);

  const totalCartUnits = cart.reduce(
    (sum, item) => sum + (item.cart_quantity || 1),
    0
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
        <StatusBar style="light" backgroundColor={colors.surface} />

        {/* Global Header */}
        <Header
          title={
            activeTab === 'sell'
              ? 'HB Works POS'
              : activeTab === 'inventory'
              ? 'Inventory'
              : 'Income & Reports'
          }
          isOnline={isOnline}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => {
            const nextSound = !settings.soundEnabled;
            const updated = { ...settings, soundEnabled: nextSound };
            setSettings(updated);
            saveSettingsToStorage(updated);
            showToast(nextSound ? 'Sound Feedback: ON' : 'Sound Feedback: OFF');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Notification Toast */}
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>

        {/* Primary Screen Views */}
        <View style={styles.screenContainer}>
          {activeTab === 'sell' && (
            <SellScreen
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQty={handleUpdateCartQty}
              onRemoveCartItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              onOpenScanner={() => setIsScannerOpen(true)}
              onProceedCheckout={() => setIsCheckoutOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryScreen
              products={products}
              onOpenReceiveStock={() => {
                setReceiveStockInitialBarcode('');
                setIsReceiveStockOpen(true);
              }}
              onAdjustStock={handleAdjustStock}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'income' && (
            <IncomeScreen
              transactions={transactions}
              onViewReceipt={(txn) => {
                setCurrentReceiptSale(txn);
                setIsReceiptOpen(true);
              }}
              onClearTransactions={() => {
                setTransactions([]);
                saveTransactionsToStorage([]);
                showToast('Transactions reset');
              }}
            />
          )}
        </View>

        {/* Bottom Tab Bar */}
        <BottomTabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          cartCount={totalCartUnits}
        />

        {/* Modals & Sheets */}
        <CameraScannerModal
          visible={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleBarcodeDetected}
        />

        <CheckoutModal
          visible={isCheckoutOpen}
          total={cart.reduce(
            (sum, item) => sum + (item.price || 0) * (item.cart_quantity || 1),
            0
          )}
          onClose={() => setIsCheckoutOpen(false)}
          onCompleteSale={handleCompleteSale}
        />

        <ReceiptModal
          visible={isReceiptOpen}
          sale={currentReceiptSale}
          storeSettings={settings}
          onClose={() => setIsReceiptOpen(false)}
        />

        <ReceiveStockModal
          visible={isReceiveStockOpen}
          initialBarcode={receiveStockInitialBarcode}
          onClose={() => setIsReceiveStockOpen(false)}
          onSaveProduct={handleSaveProduct}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        <SupabaseSettingsModal
          visible={isSettingsOpen}
          settings={settings}
          offlineQueueCount={offlineQueue.length}
          onClose={() => setIsSettingsOpen(false)}
          onSaveSettings={handleSaveSettings}
          onSyncNow={handleSyncNow}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toastContainer: {
    position: 'absolute',
    top: 75,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
