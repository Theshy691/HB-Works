// UI Views, Modals, Tab Navigation, and Rendering Module
import {
    products,
    cart,
    transactions,
    inventoryFilter,
    setInventoryFilter,
    clearCart,
    updateCartItemQty,
    removeCartItem,
    setCurrentActiveTab,
    saveLocalState,
    setTransactions,
    escapeHtml
} from './state.js';
import { playBeep, initAudio } from './audio.js';

export function showToast(message) {
    const toast = document.getElementById('scan-toast');
    const toastMsg = document.getElementById('scan-toast-msg');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2400);
}

// --- Tab Navigation ---
export function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        'sell': 'Sell',
        'inventory': 'Inventory',
        'income': 'Income'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            setCurrentActiveTab(targetId);

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById(`tab-${targetId}`);
            if (targetTab) targetTab.classList.add('active');

            if (titles[targetId] && pageTitle) {
                pageTitle.textContent = titles[targetId];
            }

            if (targetId === 'inventory') renderInventory();
            if (targetId === 'income') renderIncomeDashboard();
        });
    });
}

// --- Cart Actions & Rendering ---
export function setupCartActions(findAndAddToCartFn) {
    const quickInput = document.getElementById('cart-quick-input');
    const quickAddBtn = document.getElementById('quick-add-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    const handleQuickAdd = () => {
        const query = quickInput.value.trim();
        if (!query) return;

        const product = products.find(p => p.barcode === query || p.name.toLowerCase().includes(query.toLowerCase()));
        if (product) {
            findAndAddToCartFn(product.barcode);
            quickInput.value = '';
            quickInput.blur();
        } else {
            playBeep('error');
            alert(`No item found matching "${query}".`);
        }
    };

    if (quickAddBtn) quickAddBtn.addEventListener('click', handleQuickAdd);
    if (quickInput) {
        quickInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleQuickAdd();
            }
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            if (confirm('Clear all items from cart?')) {
                clearCart();
                renderCart();
            }
        });
    }
}

export function renderCart() {
    const cartList = document.getElementById('cart-list');
    const emptyState = document.getElementById('empty-cart-state');
    const cartCountEl = document.getElementById('cart-item-count');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('proceed-checkout-btn');
    const checkoutBtnTotal = document.getElementById('checkout-btn-total');

    if (!cartList) return;

    cartList.innerHTML = '';
    const totalItems = cart.reduce((sum, item) => sum + item.cart_quantity, 0);
    const totalSum = cart.reduce((sum, item) => sum + (item.price * item.cart_quantity), 0);

    if (cartCountEl) cartCountEl.textContent = totalItems;

    if (cart.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (clearCartBtn) clearCartBtn.classList.add('hidden');
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00';
        if (checkoutBtnTotal) checkoutBtnTotal.textContent = '$0.00';
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (clearCartBtn) clearCartBtn.classList.remove('hidden');
    if (checkoutBtn) checkoutBtn.disabled = false;

    cart.forEach(item => {
        const itemTotal = item.price * item.cart_quantity;
        const li = document.createElement('li');
        li.className = 'item';
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-barcode">BC: ${escapeHtml(item.barcode)} • $${item.price.toFixed(2)} ea</span>
            </div>
            <div class="item-right-actions">
                <div class="qty-stepper">
                    <button class="qty-step-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease">&minus;</button>
                    <span class="qty-display">${item.cart_quantity}</span>
                    <button class="qty-step-btn" data-action="inc" data-id="${item.id}" aria-label="Increase">&plus;</button>
                </div>
                <span class="item-price">$${itemTotal.toFixed(2)}</span>
                <button class="delete-item-btn" data-id="${item.id}" aria-label="Remove item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
        cartList.appendChild(li);
    });

    cartList.querySelectorAll('.qty-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            updateCartItemQty(id, action === 'inc' ? 1 : -1);
            renderCart();
        });
    });

    cartList.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            removeCartItem(id);
            renderCart();
        });
    });

    const formattedTotal = `$${totalSum.toFixed(2)}`;
    if (subtotalEl) subtotalEl.textContent = formattedTotal;
    if (totalEl) totalEl.textContent = formattedTotal;
    if (checkoutBtnTotal) checkoutBtnTotal.textContent = formattedTotal;
}

// --- Checkout Modal & Cash Calculator ---
export function setupCheckoutModal(processSaleFn) {
    const proceedBtn = document.getElementById('proceed-checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const modalTotalAmount = document.getElementById('modal-total-amount');
    const cashInput = document.getElementById('cash-received-input');
    const quickCashBtns = document.querySelectorAll('.quick-cash-btn');
    const changeDueVal = document.getElementById('change-due-val');
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    const confirmCheckoutBtn = document.getElementById('confirm-checkout-btn');
    const cashCalcSection = document.getElementById('cash-calculator-section');

    let selectedMethod = 'Cash';

    const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.cart_quantity), 0);

    const updateChangeCalculation = () => {
        const total = getCartTotal();
        const tendered = parseFloat(cashInput.value) || 0;
        const change = tendered - total;

        if (change >= 0) {
            changeDueVal.textContent = `$${change.toFixed(2)}`;
            changeDueVal.style.color = 'var(--success-color)';
        } else {
            changeDueVal.textContent = `-$${Math.abs(change).toFixed(2)}`;
            changeDueVal.style.color = 'var(--danger-color)';
        }
    };

    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            const total = getCartTotal();
            if (modalTotalAmount) modalTotalAmount.textContent = `$${total.toFixed(2)}`;
            if (cashInput) {
                cashInput.value = total.toFixed(2);
                updateChangeCalculation();
            }
            if (checkoutModal) checkoutModal.classList.remove('hidden');
        });
    }

    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => {
            if (checkoutModal) checkoutModal.classList.add('hidden');
        });
    }

    paymentMethodBtns.forEach(label => {
        label.addEventListener('click', () => {
            paymentMethodBtns.forEach(l => l.classList.remove('active'));
            label.classList.add('active');
            const radio = label.querySelector('input');
            if (radio) {
                selectedMethod = radio.value;
                if (cashCalcSection) {
                    cashCalcSection.style.display = selectedMethod === 'Cash' ? 'flex' : 'none';
                }
            }
        });
    });

    if (cashInput) {
        cashInput.addEventListener('input', updateChangeCalculation);
    }

    quickCashBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            const total = getCartTotal();
            if (type === 'exact') {
                cashInput.value = total.toFixed(2);
            } else {
                const val = parseFloat(btn.getAttribute('data-val'));
                cashInput.value = val.toFixed(2);
            }
            updateChangeCalculation();
        });
    });

    if (confirmCheckoutBtn) {
        confirmCheckoutBtn.addEventListener('click', async () => {
            const total = getCartTotal();
            const tendered = selectedMethod === 'Cash' ? (parseFloat(cashInput.value) || total) : total;

            if (selectedMethod === 'Cash' && tendered < total) {
                if (!confirm(`Tendered amount ($${tendered.toFixed(2)}) is less than total ($${total.toFixed(2)}). Continue anyway?`)) {
                    return;
                }
            }

            confirmCheckoutBtn.disabled = true;

            try {
                await processSaleFn(total, selectedMethod, tendered);
                if (checkoutModal) checkoutModal.classList.add('hidden');
            } catch (err) {
                console.error('Checkout error:', err);
                alert('Checkout transaction failed.');
            } finally {
                confirmCheckoutBtn.disabled = false;
            }
        });
    }
}

// --- Thermal Receipt Modal ---
export function showReceiptModal(sale) {
    const receiptModal = document.getElementById('receipt-modal');
    const receiptTime = document.getElementById('receipt-timestamp');
    const receiptTxn = document.getElementById('receipt-txn-id');
    const receiptList = document.getElementById('receipt-items-list');
    const receiptTotal = document.getElementById('receipt-total-amount');
    const receiptPaid = document.getElementById('receipt-paid-amount');
    const receiptChange = document.getElementById('receipt-change-amount');
    const receiptMethod = document.getElementById('receipt-pay-method');
    const closeBtn = document.getElementById('close-receipt-btn');

    if (!receiptModal) return;

    if (receiptTime) receiptTime.textContent = new Date(sale.timestamp).toLocaleString();
    if (receiptTxn) receiptTxn.textContent = `Receipt #${sale.id}`;
    if (receiptTotal) receiptTotal.textContent = `$${sale.total.toFixed(2)}`;
    if (receiptPaid) receiptPaid.textContent = `$${sale.tendered.toFixed(2)}`;
    if (receiptChange) receiptChange.textContent = `$${sale.change.toFixed(2)}`;
    if (receiptMethod) receiptMethod.textContent = sale.payMethod;

    if (receiptList && sale.items) {
        receiptList.innerHTML = '';
        sale.items.forEach(item => {
            const line = document.createElement('div');
            line.className = 'receipt-line';
            line.innerHTML = `
                <span>${item.qty}x ${escapeHtml(item.name)}</span>
                <span>$${(item.price * item.qty).toFixed(2)}</span>
            `;
            receiptList.appendChild(line);
        });
    }

    receiptModal.classList.remove('hidden');

    if (closeBtn) {
        closeBtn.onclick = () => {
            receiptModal.classList.add('hidden');
        };
    }
}

// --- Inventory Management ---
export function setupReceiveStockModal(onStockSavedFn, startCameraFn) {
    const openBtn = document.getElementById('open-receive-modal-btn');
    const closeBtn = document.getElementById('close-receive-btn');
    const modal = document.getElementById('receive-stock-modal');
    const form = document.getElementById('receive-stock-form');
    const scanForStockBtn = document.getElementById('scan-for-stock-btn');
    const searchInput = document.getElementById('inventory-search');
    const filterPills = document.querySelectorAll('.filter-pill');

    if (openBtn) {
        openBtn.addEventListener('click', () => openReceiveStockModal());
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.classList.add('hidden');
        });
    }

    if (scanForStockBtn && startCameraFn) {
        scanForStockBtn.addEventListener('click', () => {
            startCameraFn();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderInventory(e.target.value.trim());
        });
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            setInventoryFilter(pill.getAttribute('data-filter'));
            renderInventory(searchInput ? searchInput.value.trim() : '');
        });
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const barcode = document.getElementById('stock-barcode').value.trim();
            const name = document.getElementById('stock-name').value.trim();
            const price = parseFloat(document.getElementById('stock-price').value) || 0;
            const qty = parseInt(document.getElementById('stock-qty').value, 10) || 0;

            const existingIndex = products.findIndex(p => p.barcode === barcode);

            if (existingIndex !== -1) {
                products[existingIndex].quantity_in_stock += qty;
                products[existingIndex].name = name;
                products[existingIndex].price = price;
            } else {
                products.push({
                    id: `p-${Date.now()}`,
                    barcode: barcode,
                    name: name,
                    price: price,
                    quantity_in_stock: qty,
                    category: 'General'
                });
            }

            saveLocalState();
            renderInventory();
            playBeep('success');
            showToast(`Inventory updated for ${name}`);

            if (onStockSavedFn) {
                await onStockSavedFn({
                    name,
                    barcode,
                    price,
                    quantity_in_stock: (existingIndex !== -1 ? products[existingIndex].quantity_in_stock : qty)
                });
            }

            if (modal) modal.classList.add('hidden');
            form.reset();
        });
    }
}

export function openReceiveStockModal(prefillBarcode = '') {
    const modal = document.getElementById('receive-stock-modal');
    const barcodeInput = document.getElementById('stock-barcode');
    const nameInput = document.getElementById('stock-name');
    const priceInput = document.getElementById('stock-price');
    const qtyInput = document.getElementById('stock-qty');

    if (barcodeInput) barcodeInput.value = prefillBarcode;

    if (prefillBarcode) {
        const existing = products.find(p => p.barcode === prefillBarcode);
        if (existing) {
            if (nameInput) nameInput.value = existing.name;
            if (priceInput) priceInput.value = existing.price;
        }
    }

    if (modal) modal.classList.remove('hidden');
}

export function renderInventory(searchTerm = '') {
    const list = document.getElementById('inventory-list');
    const lowStockCountEl = document.getElementById('low-stock-count');
    if (!list) return;

    list.innerHTML = '';

    const lowStockItems = products.filter(p => p.quantity_in_stock < 10);
    if (lowStockCountEl) lowStockCountEl.textContent = lowStockItems.length;

    let filtered = products;

    if (inventoryFilter === 'low') {
        filtered = lowStockItems;
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.barcode.includes(term));
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <li class="empty-state">
                <p>No products found</p>
                <span class="subtext">Use Receive / Add Stock to add new items</span>
            </li>
        `;
        return;
    }

    filtered.forEach(item => {
        const isLow = item.quantity_in_stock < 10;
        const li = document.createElement('li');
        li.className = 'item';
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-barcode">BC: ${escapeHtml(item.barcode)} • $${item.price.toFixed(2)}</span>
            </div>
            <div class="stock-info">
                <span class="stock-tag ${isLow ? 'low-stock' : ''}">${item.quantity_in_stock} in stock</span>
            </div>
        `;
        list.appendChild(li);
    });
}

// --- Income Dashboard ---
export function renderIncomeDashboard() {
    const todayRevenueEl = document.getElementById('today-revenue');
    const todayOrdersEl = document.getElementById('today-order-count');
    const todayItemsSoldEl = document.getElementById('today-items-sold');
    const todayAvgTicketEl = document.getElementById('today-avg-ticket');
    const txnList = document.getElementById('transaction-list');
    const clearTxnBtn = document.getElementById('clear-transactions-btn');

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalOrders = transactions.length;
    const totalItems = transactions.reduce((sum, t) => sum + (t.itemsCount || 1), 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    if (todayRevenueEl) todayRevenueEl.textContent = `$${totalRevenue.toFixed(2)}`;
    if (todayOrdersEl) todayOrdersEl.textContent = totalOrders;
    if (todayItemsSoldEl) todayItemsSoldEl.textContent = totalItems;
    if (todayAvgTicketEl) todayAvgTicketEl.textContent = `$${avgTicket.toFixed(2)}`;

    if (txnList) {
        txnList.innerHTML = '';
        if (transactions.length === 0) {
            txnList.innerHTML = `
                <li class="empty-state">
                    <p>No transactions yet</p>
                    <span class="subtext">Completed sales will appear here</span>
                </li>
            `;
            return;
        }

        transactions.forEach(txn => {
            const timeStr = new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const li = document.createElement('li');
            li.className = 'item';
            li.style.cursor = 'pointer';
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${escapeHtml(txn.id)}</span>
                    <span class="item-time">${timeStr} • ${escapeHtml(txn.payMethod || 'Sale')} (${txn.itemsCount || 1} items)</span>
                </div>
                <span class="item-price positive">+$${txn.total.toFixed(2)}</span>
            `;
            li.addEventListener('click', () => {
                showReceiptModal(txn);
            });
            txnList.appendChild(li);
        });
    }

    if (clearTxnBtn) {
        clearTxnBtn.onclick = () => {
            if (confirm('Reset today\'s transaction records?')) {
                setTransactions([]);
                renderIncomeDashboard();
            }
        };
    }
}

// --- iOS PWA Install Banner ---
export function setupIosPwaBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const closeBtn = document.getElementById('pwa-banner-close');

    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const bannerDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';

    if (isIos && !isStandalone && !bannerDismissed && banner) {
        banner.classList.remove('hidden');
    }

    if (closeBtn && banner) {
        closeBtn.addEventListener('click', () => {
            banner.classList.add('hidden');
            sessionStorage.setItem('pwa_banner_dismissed', 'true');
        });
    }
}
