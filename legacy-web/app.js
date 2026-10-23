// HB Works POS - Main Application Entry & Controller
import {
    products,
    cart,
    addToCart,
    addTransaction,
    clearCart,
    saveLocalState
} from './js/state.js';

import {
    initAudio,
    playBeep,
    setupSoundToggle
} from './js/audio.js';

import {
    initSupabaseClient,
    setupSupabaseModal,
    findProductInSupabase,
    syncSaleToSupabase,
    syncStockToSupabase,
    syncOfflineSalesQueue,
    registerOnProductsUpdated
} from './js/supabase.js';

import {
    setupBluetoothScannerListener,
    setupCameraScanner,
    startCameraScanner,
    registerOnScan
} from './js/scanner.js';

import {
    showToast,
    setupTabNavigation,
    setupCartActions,
    renderQuickProductCatalog,
    renderCart,
    renderInventory,
    renderIncomeDashboard,
    setupCheckoutModal,
    showReceiptModal,
    setupReceiveStockModal,
    openReceiveStockModal,
    setupIosPwaBanner
} from './js/ui.js';

// --- Barcode / Product Lookup & Cart Router ---
export async function findAndAddToCart(input) {
    initAudio();

    if (!input) return;

    let product = null;

    if (typeof input === 'object' && input !== null) {
        // Direct product object passed from quick catalog tile tap
        product = input;
    } else {
        const query = String(input).trim();
        if (!query) return;

        const lower = query.toLowerCase();

        // 1. Exact barcode match or exact name match in local cache
        product = products.find(p => {
            const b = String(p.barcode || p.barcode_sku || '');
            const n = String(p.name || p.product_name || '').toLowerCase();
            return b === query || n === lower;
        });

        // 2. Partial barcode or partial name match in local cache
        if (!product) {
            product = products.find(p => {
                const b = String(p.barcode || p.barcode_sku || '');
                const n = String(p.name || p.product_name || '').toLowerCase();
                return b.includes(query) || n.includes(lower);
            });
        }

        // 3. Cloud lookup via Supabase
        if (!product) {
            product = await findProductInSupabase(query);
        }
    }

    if (product) {
        addToCart(product);
        renderCart();
        playBeep('success');
        showToast(`Added: ${product.name || 'Item'}`);
    } else {
        playBeep('error');
        showToast(`Not found: ${input}`);
        if (confirm(`Item "${input}" not found in inventory. Would you like to add it now?`)) {
            openReceiveStockModal(typeof input === 'string' ? input : '');
        }
    }
}

// --- Checkout Transaction Processor ---
export async function processSale(total, payMethod, tendered) {
    const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const change = Math.max(0, tendered - total);
    const cartSnapshot = cart.map(i => ({ ...i }));

    const saleRecord = {
        id: txnId,
        timestamp: new Date().toISOString(),
        total: Number(total) || 0,
        payMethod: payMethod,
        tendered: Number(tendered) || 0,
        change: Number(change) || 0,
        itemsCount: cartSnapshot.reduce((sum, i) => sum + (Number(i.cart_quantity) || 1), 0),
        items: cartSnapshot.map(i => ({
            id: i.id,
            name: i.name,
            barcode: i.barcode,
            qty: Number(i.cart_quantity) || 1,
            price: Number(i.price) || 0
        }))
    };

    // 1. Deduct stock locally
    cartSnapshot.forEach(cartItem => {
        const prod = products.find(p => (cartItem.barcode && p.barcode === cartItem.barcode) || p.id === cartItem.id);
        if (prod) {
            prod.quantity_in_stock = Math.max(0, (Number(prod.quantity_in_stock) || 0) - (Number(cartItem.cart_quantity) || 1));
        }
    });

    // 2. Record transaction locally
    addTransaction(saleRecord);

    // 3. Immediate POS feedback & Receipt (instant UI, no blocking on network)
    playBeep('checkout');
    showReceiptModal(saleRecord);

    // 4. Reset Cart and update views
    clearCart();
    renderCart();
    renderInventory();
    renderIncomeDashboard();
    renderQuickProductCatalog(findAndAddToCart);

    // 5. Cloud sync to Supabase in background
    syncSaleToSupabase(saleRecord, cartSnapshot).then(success => {
        if (success) {
            console.log('Sale successfully synced to cloud.');
        }
    }).catch(err => {
        console.warn('Background Supabase sync error:', err);
    });
}

// --- Barcode Scan Event Router ---
registerOnScan((scannedCode) => {
    const receiveModal = document.getElementById('receive-stock-modal');
    if (receiveModal && !receiveModal.classList.contains('hidden')) {
        const barcodeInput = document.getElementById('stock-barcode');
        if (barcodeInput) {
            barcodeInput.value = scannedCode;
            playBeep('success');
            showToast(`Scanned Barcode: ${scannedCode}`);
            return;
        }
    }
    findAndAddToCart(scannedCode);
});

// Update inventory and quick catalog whenever cloud sync finishes
registerOnProductsUpdated(() => {
    renderInventory();
    renderQuickProductCatalog(findAndAddToCart);
});

// --- Service Worker ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
                .catch((err) => console.log('SW registration error:', err));
        });
    }
}

// --- Application Bootstrap ---
document.addEventListener('DOMContentLoaded', () => {
    // Navigation & Controllers
    setupTabNavigation();
    setupCartActions(findAndAddToCart);
    setupBluetoothScannerListener();
    setupCameraScanner();
    setupCheckoutModal(processSale);
    setupReceiveStockModal(syncStockToSupabase, startCameraScanner);
    setupSoundToggle();
    setupIosPwaBanner();
    registerServiceWorker();

    // Supabase Cloud Initialization
    initSupabaseClient();
    setupSupabaseModal(showToast);
    syncOfflineSalesQueue();

    // Initial View Renders
    renderCart();
    renderInventory();
    renderIncomeDashboard();
    renderQuickProductCatalog(findAndAddToCart);
});
