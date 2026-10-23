// Supabase Backend Client & Real-time Cloud Synchronization
import { products, setProducts, saveLocalState } from './state.js';

const DEFAULT_SUPABASE_URL = 'https://nxgnarvsggetjlhhsvyw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_iMAD-utJJkJOeuxYFGRTBw_YkbyiVGz';

const OFFLINE_QUEUE_KEY = 'hb_pos_offline_sales_queue';

let SUPABASE_URL = localStorage.getItem('hb_pos_supabase_url') || DEFAULT_SUPABASE_URL;
let SUPABASE_ANON_KEY = localStorage.getItem('hb_pos_supabase_key') || DEFAULT_SUPABASE_KEY;
let supabase = null;
let isSyncingQueue = false;

let onProductsUpdatedCallback = null;

export function registerOnProductsUpdated(cb) {
    onProductsUpdatedCallback = cb;
}

export function getSupabaseClient() {
    return supabase;
}

export async function ensureSupabaseClient() {
    if (supabase) return supabase;

    SUPABASE_URL = localStorage.getItem('hb_pos_supabase_url') || DEFAULT_SUPABASE_URL;
    SUPABASE_ANON_KEY = localStorage.getItem('hb_pos_supabase_key') || DEFAULT_SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        updateDbStatusUI(false, 'Disconnected (Enter Credentials)');
        return null;
    }

    let clientFactory = (typeof window !== 'undefined' && window.createClient) || null;

    if (!clientFactory) {
        try {
            const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
            if (mod && mod.createClient) {
                clientFactory = mod.createClient;
                window.createClient = mod.createClient;
            }
        } catch (e) {
            console.warn('Could not load Supabase ESM module dynamically:', e);
        }
    }

    if (clientFactory) {
        try {
            supabase = clientFactory(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
            updateDbStatusUI(true, 'Connected to Cloud');
            pullProductsFromSupabase(true);
            syncOfflineSalesQueue();
            return supabase;
        } catch (err) {
            console.error('Failed to init Supabase client:', err);
            updateDbStatusUI(false, 'Initialization Error');
            supabase = null;
            return null;
        }
    } else {
        updateDbStatusUI(false, 'Disconnected (Local Storage Only)');
        return null;
    }
}

export function initSupabaseClient() {
    ensureSupabaseClient();
    return supabase !== null;
}

export function updateDbStatusUI(isOnline, statusMessage) {
    const headerDot = document.getElementById('header-db-dot');
    const statusDot = document.getElementById('db-status-indicator');
    const statusText = document.getElementById('db-status-text');

    if (headerDot) {
        headerDot.className = `db-status-dot ${isOnline ? 'online' : 'offline'}`;
        headerDot.title = statusMessage;
    }
    if (statusDot) {
        statusDot.className = `status-indicator-dot ${isOnline ? 'online' : 'offline'}`;
    }
    if (statusText) {
        statusText.textContent = statusMessage;
    }
}

export async function checkSupabaseHealth(showToastFn) {
    await ensureSupabaseClient();
    if (!supabase) {
        updateDbStatusUI(false, 'Disconnected (Enter Credentials)');
        return;
    }
    try {
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        updateDbStatusUI(true, `Connected to Cloud (${count !== null ? count : 0} items)`);
        if (showToastFn) showToastFn('Supabase connection verified! 🟢');
        syncOfflineSalesQueue();
    } catch (err) {
        console.error('Supabase health check failed:', err);
        updateDbStatusUI(false, 'Warning: ' + (err.message || 'Check tables'));
        if (showToastFn) showToastFn('Table issue: ' + (err.message || 'Check tables'));
    }
}

export async function pullProductsFromSupabase(silent = false, showToastFn) {
    await ensureSupabaseClient();
    if (!supabase) {
        if (!silent && showToastFn) showToastFn('Supabase not connected');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            const normalized = data.map(p => ({
                id: p.id,
                name: String(p.name || 'Item').trim(),
                barcode: String(p.barcode || '').trim(),
                price: Math.max(0, Number(p.price) || 0),
                quantity_in_stock: Math.max(0, Number(p.quantity_in_stock) || 0),
                category: String(p.category || 'General').trim()
            }));
            setProducts(normalized);
            if (onProductsUpdatedCallback) onProductsUpdatedCallback();
            updateDbStatusUI(true, `Connected (${normalized.length} products synced)`);
            if (!silent && showToastFn) showToastFn(`Synced ${normalized.length} products from cloud!`);
        } else {
            if (!silent && showToastFn) showToastFn('No products found in cloud table');
        }
    } catch (err) {
        console.error('Error pulling products from Supabase:', err);
        updateDbStatusUI(false, 'Sync failed: ' + (err.message || 'Error'));
        if (!silent && showToastFn) showToastFn('Failed to pull: ' + (err.message || 'Error'));
    }
}

export async function pushProductsToSupabase(showToastFn) {
    await ensureSupabaseClient();
    if (!supabase) {
        if (showToastFn) showToastFn('Supabase not connected');
        return;
    }

    try {
        if (showToastFn) showToastFn('Uploading products to cloud...');
        const payload = products
            .map(p => ({
                name: String(p.name || 'Item').trim(),
                barcode: String(p.barcode || '').trim(),
                price: Math.max(0, Number(p.price) || 0),
                quantity_in_stock: Math.max(0, Number(p.quantity_in_stock) || 0),
                category: String(p.category || 'General').trim()
            }))
            .filter(p => p.barcode.length > 0 && p.name.length > 0);

        if (payload.length === 0) {
            if (showToastFn) showToastFn('No valid products to upload');
            return;
        }

        const { error } = await supabase
            .from('products')
            .upsert(payload, { onConflict: 'barcode' });

        if (error) throw error;

        if (showToastFn) showToastFn(`Uploaded ${payload.length} products to Supabase!`);
        updateDbStatusUI(true, `Connected (${payload.length} cloud products)`);
    } catch (err) {
        console.error('Error pushing products to Supabase:', err);
        if (showToastFn) showToastFn('Failed to upload: ' + (err.message || 'Error'));
    }
}

export async function findProductInSupabase(query) {
    await ensureSupabaseClient();
    if (!supabase) return null;
    const cleanQuery = String(query).replace(/[%,_()]/g, '').trim();
    if (!cleanQuery) return null;

    try {
        // 1. Try exact barcode match first
        let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', cleanQuery)
            .limit(1)
            .maybeSingle();

        // 2. If not found by barcode, search by name (case-insensitive substring)
        if (!data) {
            const res = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${cleanQuery}%`)
                .limit(1);
            if (res.data && res.data.length > 0) {
                data = res.data[0];
            }
        }

        if (data) {
            const normalized = {
                id: data.id,
                name: String(data.name || 'Item').trim(),
                barcode: String(data.barcode || '').trim(),
                price: Math.max(0, Number(data.price) || 0),
                quantity_in_stock: Math.max(0, Number(data.quantity_in_stock) || 0),
                category: String(data.category || 'General').trim()
            };
            if (!products.some(p => p.id === normalized.id || (normalized.barcode && p.barcode === normalized.barcode))) {
                products.push(normalized);
                saveLocalState();
                if (onProductsUpdatedCallback) onProductsUpdatedCallback();
            }
            return normalized;
        }
    } catch (err) {
        console.error('Supabase product lookup error:', err);
    }
    return null;
}

// --- Offline Queue Helpers ---
function getOfflineQueue() {
    try {
        const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveOfflineQueue(queue) {
    try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.warn('Could not persist offline queue:', e);
    }
}

function enqueueOfflineSale(saleRecord, cartItems) {
    const queue = getOfflineQueue();
    // Avoid duplicate queue entries
    if (!queue.some(item => item.saleRecord.id === saleRecord.id)) {
        queue.push({ saleRecord, cartItems, queuedAt: Date.now() });
        saveOfflineQueue(queue);
        console.info(`Queued offline transaction ${saleRecord.id} for auto-sync.`);
    }
}

export async function syncOfflineSalesQueue() {
    if (isSyncingQueue || !supabase) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    isSyncingQueue = true;
    console.log(`Draining offline sales queue (${queue.length} pending)...`);

    const remaining = [];
    for (const item of queue) {
        const success = await executeSaleSync(item.saleRecord, item.cartItems);
        if (!success) {
            remaining.push(item);
        }
    }

    saveOfflineQueue(remaining);
    isSyncingQueue = false;

    if (queue.length > remaining.length) {
        console.log(`Synced ${queue.length - remaining.length} queued offline transactions.`);
    }
}

// Low-level sync executor with RPC preference & REST fallback
async function executeSaleSync(saleRecord, cartItems) {
    if (!supabase) return false;

    try {
        // Method A: Attempt atomic database procedure (process_pos_sale)
        const { data: rpcData, error: rpcErr } = await supabase.rpc('process_pos_sale', {
            p_transaction_id: String(saleRecord.id),
            p_total: Number(saleRecord.total) || 0,
            p_payment_method: String(saleRecord.payMethod || 'Cash'),
            p_amount_tendered: Number(saleRecord.tendered) || 0,
            p_change_amount: Number(saleRecord.change) || 0,
            p_items: saleRecord.items || []
        });

        if (!rpcErr && rpcData && rpcData.success) {
            return true;
        }

        // Method B: Graceful fallback to direct insert & update if RPC is missing
        const { error: saleErr } = await supabase.from('sales').insert([{
            transaction_id: String(saleRecord.id),
            total_amount: Math.max(0, Number(saleRecord.total) || 0),
            payment_method: String(saleRecord.payMethod || 'Cash'),
            amount_tendered: Math.max(0, Number(saleRecord.tendered) || 0),
            change_amount: Math.max(0, Number(saleRecord.change) || 0),
            items: saleRecord.items || []
        }]);

        if (saleErr && saleErr.code !== '23505') { // ignore duplicate key if already synced
            throw saleErr;
        }

        // Decrement stock in fallback mode
        for (const cartItem of cartItems) {
            const barcode = cartItem.barcode;
            if (barcode) {
                const prod = products.find(p => p.barcode === barcode);
                const newStock = prod ? Math.max(0, prod.quantity_in_stock) : 0;
                await supabase.from('products')
                    .update({ quantity_in_stock: newStock })
                    .eq('barcode', barcode);
            }
        }
        return true;
    } catch (err) {
        console.warn('executeSaleSync failed:', err);
        return false;
    }
}

export async function syncSaleToSupabase(saleRecord, cartItems) {
    await ensureSupabaseClient();
    if (!supabase) {
        enqueueOfflineSale(saleRecord, cartItems);
        return false;
    }

    const success = await executeSaleSync(saleRecord, cartItems);
    if (!success) {
        enqueueOfflineSale(saleRecord, cartItems);
    }
    return success;
}

export async function syncStockToSupabase(productData) {
    await ensureSupabaseClient();
    if (!supabase) return;
    try {
        const barcode = String(productData.barcode || '').trim();
        const name = String(productData.name || 'Item').trim();
        if (!barcode || !name) return;

        await supabase.from('products').upsert([{
            name: name,
            barcode: barcode,
            price: Math.max(0, Number(productData.price) || 0),
            quantity_in_stock: Math.max(0, Number(productData.quantity_in_stock) || 0),
            category: String(productData.category || 'General').trim()
        }], { onConflict: 'barcode' });
    } catch (dbErr) {
        console.warn('Could not sync stock to Supabase:', dbErr);
    }
}

// Auto-sync listener when browser reconnects to internet
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('Network online. Triggering Supabase cloud sync...');
        ensureSupabaseClient().then(() => syncOfflineSalesQueue());
    });
}

export function setupSupabaseModal(showToastFn) {
    const openBtn = document.getElementById('db-settings-btn');
    const closeBtn = document.getElementById('close-db-modal-btn');
    const modal = document.getElementById('db-settings-modal');
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const saveBtn = document.getElementById('save-db-config-btn');
    const pullBtn = document.getElementById('sync-pull-btn');
    const pushBtn = document.getElementById('sync-push-btn');

    if (!modal) return;

    if (urlInput) urlInput.value = localStorage.getItem('hb_pos_supabase_url') || (SUPABASE_URL !== 'YOUR_SUPABASE_URL' ? SUPABASE_URL : '');
    if (keyInput) keyInput.value = localStorage.getItem('hb_pos_supabase_key') || (SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' ? SUPABASE_ANON_KEY : '');

    const openModal = () => {
        modal.classList.remove('hidden');
        if (supabase) {
            checkSupabaseHealth(showToastFn);
        }
    };
    const closeModal = () => modal.classList.add('hidden');

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const url = (urlInput.value || '').trim();
            const key = (keyInput.value || '').trim();

            if (!url || !key) {
                alert('Please enter both your Supabase Project URL and Anon/Publishable API Key.');
                return;
            }

            // Security sanity check: Never store secret / service_role keys on client
            if (key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role')) {
                alert('SECURITY WARNING: Do NOT use a Secret Key or Service Role Key in the client browser! Use only your Anon / Publishable key (sb_publishable_...).');
                return;
            }

            localStorage.setItem('hb_pos_supabase_url', url);
            localStorage.setItem('hb_pos_supabase_key', key);
            SUPABASE_URL = url;
            SUPABASE_ANON_KEY = key;

            updateDbStatusUI(false, 'Connecting...');
            const success = initSupabaseClient();
            if (success) {
                await checkSupabaseHealth(showToastFn);
            }
        });
    }

    if (pullBtn) pullBtn.addEventListener('click', () => pullProductsFromSupabase(false, showToastFn));
    if (pushBtn) pushBtn.addEventListener('click', () => pushProductsToSupabase(showToastFn));
}
