// HB Works POS - State Management & Storage Engine
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  INVENTORY: '@hb_pos_inventory_v1',
  TRANSACTIONS: '@hb_pos_transactions_v1',
  OFFLINE_QUEUE: '@hb_pos_offline_queue_v1',
  SETTINGS: '@hb_pos_settings_v1',
};

export const DEFAULT_PRODUCTS = [
  {
    id: 'p1',
    name: 'Motul 300V 4T 10W40 1L',
    barcode: '8901234567',
    price: 850.00,
    quantity_in_stock: 24,
    category: 'Oil & Fluids',
    icon: 'water-outline',
  },
  {
    id: 'p2',
    name: 'Yamaha OEM Oil Filter',
    barcode: '4567890123',
    price: 180.00,
    quantity_in_stock: 20,
    category: 'Maintenance',
    icon: 'construct-outline',
  },
  {
    id: 'p3',
    name: 'Brembo Ceramic Brake Pads',
    barcode: '8907654321',
    price: 1250.00,
    quantity_in_stock: 12,
    category: 'Brakes',
    icon: 'disc-outline',
  },
  {
    id: 'p4',
    name: 'Pirelli Angel Scooter 120/70-14',
    barcode: '8901122334',
    price: 2400.00,
    quantity_in_stock: 8,
    category: 'Tires',
    icon: 'radio-button-on-outline',
  },
  {
    id: 'p5',
    name: 'NGK Iridium Spark Plug CR8EIX',
    barcode: '8909988776',
    price: 420.00,
    quantity_in_stock: 35,
    category: 'Ignition',
    icon: 'flash-outline',
  },
  {
    id: 'p6',
    name: 'DID Gold Chain 428D-120L',
    barcode: '8905544332',
    price: 1650.00,
    quantity_in_stock: 10,
    category: 'Drive',
    icon: 'link-outline',
  },
  {
    id: 'p7',
    name: 'Motul Scooter Gear Oil 80W90',
    barcode: '8903344556',
    price: 140.00,
    quantity_in_stock: 30,
    category: 'Oil & Fluids',
    icon: 'color-fill-outline',
  },
  {
    id: 'p8',
    name: 'Daytona Kevlar Drive Belt',
    barcode: '8907788990',
    price: 950.00,
    quantity_in_stock: 15,
    category: 'Drive',
    icon: 'repeat-outline',
  },
];

export const DEFAULT_TRANSACTIONS = [
  {
    id: 'TXN-8492',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    total: 1030.00,
    payMethod: 'Cash',
    itemsCount: 2,
    tendered: 1100.00,
    change: 70.00,
    items: [
      { name: 'Motul 300V 4T 10W40 1L', price: 850, quantity: 1 },
      { name: 'Yamaha OEM Oil Filter', price: 180, quantity: 1 },
    ],
  },
  {
    id: 'TXN-8491',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    total: 2400.00,
    payMethod: 'GCash',
    itemsCount: 1,
    tendered: 2400.00,
    change: 0.00,
    items: [
      { name: 'Pirelli Angel Scooter 120/70-14', price: 2400, quantity: 1 },
    ],
  },
];

// Helper to generate transaction IDs
export function generateTransactionId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${num}`;
}

// Storage helpers
export async function loadStoredData() {
  try {
    const [storedProducts, storedTxns, storedQueue, storedSettings] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
      AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
      AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
    ]);

    return {
      products: storedProducts ? JSON.parse(storedProducts) : DEFAULT_PRODUCTS,
      transactions: storedTxns ? JSON.parse(storedTxns) : DEFAULT_TRANSACTIONS,
      offlineQueue: storedQueue ? JSON.parse(storedQueue) : [],
      settings: storedSettings
        ? JSON.parse(storedSettings)
        : {
            supabaseUrl: 'https://nxgnarvsggetjlhhsvyw.supabase.co',
            supabaseKey: 'sb_publishable_iMAD-utJJkJOeuxYFGRTBw_YkbyiVGz',
            soundEnabled: true,
            storeName: 'HB WORKS MOTOR SHOP',
            storeAddress: 'Taguig City, Philippines',
          },
    };
  } catch (error) {
    console.error('Failed to load stored data:', error);
    return {
      products: DEFAULT_PRODUCTS,
      transactions: DEFAULT_TRANSACTIONS,
      offlineQueue: [],
      settings: {
        supabaseUrl: 'https://nxgnarvsggetjlhhsvyw.supabase.co',
        supabaseKey: 'sb_publishable_iMAD-utJJkJOeuxYFGRTBw_YkbyiVGz',
        soundEnabled: true,
        storeName: 'HB WORKS MOTOR SHOP',
        storeAddress: 'Taguig City, Philippines',
      },
    };
  }
}

export async function saveProductsToStorage(products) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

export async function saveTransactionsToStorage(transactions) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transactions:', err);
  }
}

export async function saveOfflineQueueToStorage(queue) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving offline queue:', err);
  }
}

export async function saveSettingsToStorage(settings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
