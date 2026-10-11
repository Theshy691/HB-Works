// State Management & Local Storage Persistence

export const CURRENCY_SYMBOL = '₱';

export function formatCurrency(amount) {
    const num = Number(amount);
    if (isNaN(num)) return `${CURRENCY_SYMBOL}0.00`;
    return `${CURRENCY_SYMBOL}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Motul 300V 4T 10W40 1L', barcode: '8901234567', price: 850.00, quantity_in_stock: 24, category: 'Oil & Fluids' },
    { id: 'p2', name: 'Yamaha OEM Oil Filter', barcode: '4567890123', price: 180.00, quantity_in_stock: 20, category: 'Maintenance' },
    { id: 'p3', name: 'Brembo Ceramic Sintered Brake Pads', barcode: '8907654321', price: 1250.00, quantity_in_stock: 12, category: 'Brakes' },
    { id: 'p4', name: 'Pirelli Angel Scooter Tire 120/70-14', barcode: '8901122334', price: 2400.00, quantity_in_stock: 8, category: 'Tires' },
    { id: 'p5', name: 'NGK Iridium Spark Plug CR8EIX', barcode: '8909988776', price: 420.00, quantity_in_stock: 35, category: 'Ignition' },
    { id: 'p6', name: 'DID Gold Chain 428D-120L', barcode: '8905544332', price: 1650.00, quantity_in_stock: 10, category: 'Drive & Transmission' }
];

export const DEFAULT_TRANSACTIONS = [
    { id: 'TXN-8492', timestamp: new Date(Date.now() - 3600000).toISOString(), total: 1030.00, payMethod: 'Cash', itemsCount: 2, tendered: 1100.00, change: 70.00 },
    { id: 'TXN-8491', timestamp: new Date(Date.now() - 7200000).toISOString(), total: 2400.00, payMethod: 'Transfer', itemsCount: 1, tendered: 2400.00, change: 0.00 }
];

// App State
export const products = (function() {
    try {
        const stored = localStorage.getItem('hb_pos_inventory');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Error reading stored products:', e);
    }
    return [...DEFAULT_PRODUCTS];
})();

export const transactions = (function() {
    try {
        const stored = localStorage.getItem('hb_pos_transactions');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn('Error reading stored transactions:', e);
    }
    return [...DEFAULT_TRANSACTIONS];
})();

export const cart = [];
export let currentActiveTab = 'sell';
export let inventoryFilter = 'all';

export function saveLocalState() {
    try {
        localStorage.setItem('hb_pos_inventory', JSON.stringify(products));
        localStorage.setItem('hb_pos_transactions', JSON.stringify(transactions));
    } catch (e) {
        console.warn('Failed to save local state:', e);
    }
}

export function setProducts(newProducts) {
    if (!Array.isArray(newProducts)) return;
    products.length = 0;
    for (const p of newProducts) {
        products.push({
            id: p.id || `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: p.name || p.product_name || 'Item',
            barcode: String(p.barcode || p.barcode_sku || ''),
            price: Number(p.price) || 0,
            quantity_in_stock: Number(p.quantity_in_stock) || 0,
            category: p.category || 'General'
        });
    }
    saveLocalState();
}

export function setTransactions(newTransactions) {
    transactions.length = 0;
    if (Array.isArray(newTransactions)) {
        transactions.push(...newTransactions);
    }
    saveLocalState();
}

export function addTransaction(saleRecord) {
    transactions.unshift(saleRecord);
    saveLocalState();
}

export function clearCart() {
    cart.length = 0;
}

export function addToCart(product) {
    if (!product) return;
    const prodBarcode = String(product.barcode || product.barcode_sku || '');
    const prodId = product.id;
    const prodName = product.name || product.product_name || 'Item';
    const prodPrice = Number(product.price) || 0;
    const prodStock = Number(product.quantity_in_stock) || 0;
    const prodCat = product.category || 'General';

    const existing = cart.find(item => 
        (prodId && item.id === prodId) || 
        (prodBarcode && item.barcode === prodBarcode)
    );

    if (existing) {
        existing.cart_quantity = (Number(existing.cart_quantity) || 1) + 1;
    } else {
        cart.push({
            id: prodId || `p-${Date.now()}`,
            name: prodName,
            barcode: prodBarcode,
            price: prodPrice,
            quantity_in_stock: prodStock,
            category: prodCat,
            cart_quantity: 1
        });
    }
}

export function updateCartItemQty(productId, delta) {
    const itemIndex = cart.findIndex(i => String(i.id) === String(productId));
    if (itemIndex === -1) return;

    cart[itemIndex].cart_quantity = (Number(cart[itemIndex].cart_quantity) || 1) + delta;
    if (cart[itemIndex].cart_quantity <= 0) {
        cart.splice(itemIndex, 1);
    }
}

export function removeCartItem(productId) {
    const itemIndex = cart.findIndex(i => String(i.id) === String(productId));
    if (itemIndex !== -1) {
        cart.splice(itemIndex, 1);
    }
}

export function setCurrentActiveTab(tab) {
    currentActiveTab = tab;
}

export function setInventoryFilter(filter) {
    inventoryFilter = filter;
}

export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
