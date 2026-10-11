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
    renderCart,
    renderInventory,
    renderIncomeDashboard,
    setupCheckoutModal,
    showReceiptModal,
    setupReceiveStockModal,
    openReceiveStockModal,
    setupIosPwaBanner
} from './js/ui.js';

// --- Barcode Lookup & Cart Router ---
export async function findAndAddToCart(barcode) {
    initAudio();

    // 1. Check local cache
    let product = products.find(p => p.barcode === barcode);

    // 2. Fallback to Supabase cloud lookup if not found locally
    if (!product) {
        product = await findProductInSupabase(barcode);
    }

    if (product) {
        addToCart(product);
        renderCart();
        playBeep('success');
        showToast(`Added: ${product.name}`);
    } else {
        playBeep('error');
        showToast(`Unknown Barcode: ${barcode}`);
        if (confirm(`Barcode "${barcode}" not in inventory. Would you like to add it now?`)) {
            openReceiveStockModal(barcode);
        }
    }
}

// --- Checkout Transaction Processor ---
export async function processSale(total, payMethod, tendered) {
    const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    const change = Math.max(0, tendered - total);
    const saleRecord = {
        id: txnId,
        timestamp: new Date().toISOString(),
        total: total,
        payMethod: payMethod,
        tendered: tendered,
        change: change,
        itemsCount: cart.reduce((sum, i) => sum + i.cart_quantity, 0),
        items: cart.map(i => ({ id: i.id, name: i.name, barcode: i.barcode, qty: i.cart_quantity, price: i.price }))
    };

    // 1. Deduct stock locally
    cart.forEach(cartItem => {
        const prod = products.find(p => p.id === cartItem.id || p.barcode === cartItem.barcode);
        if (prod) {
            prod.quantity_in_stock = Math.max(0, prod.quantity_in_stock - cartItem.cart_quantity);
        }
    });

    // 2. Record transaction locally
    addTransaction(saleRecord);

    // 3. Sync to Supabase cloud in background
    await syncSaleToSupabase(saleRecord, cart);

    // 4. POS feedback & Receipt
    playBeep('checkout');
    showReceiptModal(saleRecord);

    // 5. Reset Cart and update views
    clearCart();
    renderCart();
    renderInventory();
    renderIncomeDashboard();
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

// Update inventory view whenever cloud sync finishes
registerOnProductsUpdated(() => {
    renderInventory();
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

    // Initial View Renders
    renderCart();
    renderInventory();
    renderIncomeDashboard();
});
