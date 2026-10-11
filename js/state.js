// State Management & Local Storage Persistence

export const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Motul 300V 4T 10W40', barcode: '8901234567', price: 35.00, quantity_in_stock: 24, category: 'Oil & Fluids' },
    { id: 'p2', name: 'Yamaha OEM Oil Filter', barcode: '4567890123', price: 12.50, quantity_in_stock: 15, category: 'Maintenance' },
    { id: 'p3', name: 'Brembo Sintered Brake Pads', barcode: '1234567890', price: 28.00, quantity_in_stock: 5, category: 'Brakes' },
    { id: 'p4', name: 'Motul Chain Lube Road 400ml', barcode: '5678901234', price: 16.00, quantity_in_stock: 18, category: 'Maintenance' },
    { id: 'p5', name: 'NGK Iridium Spark Plug CR9EIX', barcode: '6789012345', price: 9.50, quantity_in_stock: 32, category: 'Ignition' },
    { id: 'p6', name: 'Motocool Expert Coolant 1L', barcode: '7890123456', price: 14.00, quantity_in_stock: 7, category: 'Oil & Fluids' }
];

export const DEFAULT_TRANSACTIONS = [
    { id: 'TXN-8492', timestamp: new Date(Date.now() - 3600000).toISOString(), total: 47.50, payMethod: 'Cash', itemsCount: 3, tendered: 50.00, change: 2.50 },
    { id: 'TXN-8491', timestamp: new Date(Date.now() - 7200000).toISOString(), total: 120.00, payMethod: 'Card', itemsCount: 4, tendered: 120.00, change: 0.00 },
    { id: 'TXN-8490', timestamp: new Date(Date.now() - 14400000).toISOString(), total: 85.50, payMethod: 'Transfer', itemsCount: 2, tendered: 85.50, change: 0.00 }
];

// App State
export let products = JSON.parse(localStorage.getItem('hb_pos_inventory')) || DEFAULT_PRODUCTS;
export let transactions = JSON.parse(localStorage.getItem('hb_pos_transactions')) || DEFAULT_TRANSACTIONS;
export let cart = [];
export let currentActiveTab = 'sell';
export let inventoryFilter = 'all';

export function saveLocalState() {
    localStorage.setItem('hb_pos_inventory', JSON.stringify(products));
    localStorage.setItem('hb_pos_transactions', JSON.stringify(transactions));
}

export function setProducts(newProducts) {
    products = newProducts;
    saveLocalState();
}

export function setTransactions(newTransactions) {
    transactions = newTransactions;
    saveLocalState();
}

export function addTransaction(saleRecord) {
    transactions.unshift(saleRecord);
    saveLocalState();
}

export function clearCart() {
    cart = [];
}

export function addToCart(product) {
    const existing = cart.find(item => item.id === product.id || item.barcode === product.barcode);
    if (existing) {
        existing.cart_quantity += 1;
    } else {
        cart.push({
            ...product,
            cart_quantity: 1
        });
    }
}

export function updateCartItemQty(productId, delta) {
    const itemIndex = cart.findIndex(i => i.id === productId);
    if (itemIndex === -1) return;

    cart[itemIndex].cart_quantity += delta;
    if (cart[itemIndex].cart_quantity <= 0) {
        cart.splice(itemIndex, 1);
    }
}

export function removeCartItem(productId) {
    cart = cart.filter(i => i.id !== productId);
}

export function setCurrentActiveTab(tab) {
    currentActiveTab = tab;
}

export function setInventoryFilter(filter) {
    inventoryFilter = filter;
}

export function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
