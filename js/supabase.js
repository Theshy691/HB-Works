// Supabase Backend Client & Real-time Cloud Synchronization
import { products, setProducts, saveLocalState } from './state.js';

const DEFAULT_SUPABASE_URL = 'https://nxgnarvsggetjlhhsvyw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_iMAD-utJJkJOeuxYFGRTBw_YkbyiVGz';

let SUPABASE_URL = localStorage.getItem('hb_pos_supabase_url') || DEFAULT_SUPABASE_URL;
let SUPABASE_ANON_KEY = localStorage.getItem('hb_pos_supabase_key') || DEFAULT_SUPABASE_KEY;
let supabase = null;

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
                name: p.name || p.product_name || 'Item',
                barcode: String(p.barcode || p.barcode_sku || ''),
                price: Number(p.price) || 0,
                quantity_in_stock: Number(p.quantity_in_stock) || 0,
                category: p.category || 'General'
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
        const payload = products.map(p => ({
            name: p.name,
            product_name: p.name,
            barcode: p.barcode,
            barcode_sku: p.barcode,
            price: Number(p.price) || 0,
            quantity_in_stock: Number(p.quantity_in_stock) || 0,
            category: p.category || 'General'
        }));

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
    const cleanQuery = String(query).trim();
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
                name: data.name || data.product_name || 'Item',
                barcode: String(data.barcode || data.barcode_sku || ''),
                price: Number(data.price) || 0,
                quantity_in_stock: Number(data.quantity_in_stock) || 0,
                category: data.category || 'General'
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

export async function syncSaleToSupabase(saleRecord, cartItems) {
    await ensureSupabaseClient();
    if (!supabase) return false;
    try {
        const { error: saleErr } = await supabase.from('sales').insert([{
            transaction_id: saleRecord.id,
            total_amount: Number(saleRecord.total) || 0,
            payment_method: saleRecord.payMethod,
            amount_tendered: Number(saleRecord.tendered) || 0,
            change_amount: Number(saleRecord.change) || 0,
            items: saleRecord.items
        }]);

        if (saleErr) console.warn('Supabase sale insert warning:', saleErr);

        for (const cartItem of cartItems) {
            const barcode = cartItem.barcode;
            if (barcode) {
                const prod = products.find(p => p.barcode === barcode);
                const newStock = prod ? prod.quantity_in_stock : 0;
                await supabase.from('products')
                    .update({ quantity_in_stock: newStock })
                    .eq('barcode', barcode);
            }
        }
        return true;
    } catch (dbErr) {
        console.warn('Supabase sync warning (stored locally):', dbErr);
        return false;
    }
}

export async function syncStockToSupabase(productData) {
    await ensureSupabaseClient();
    if (!supabase) return;
    try {
        await supabase.from('products').upsert([{
            name: productData.name,
            product_name: productData.name,
            barcode: productData.barcode,
            barcode_sku: productData.barcode,
            price: Number(productData.price) || 0,
            quantity_in_stock: Number(productData.quantity_in_stock) || 0
        }], { onConflict: 'barcode' });
    } catch (dbErr) {
        console.warn('Could not sync stock to Supabase:', dbErr);
    }
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
                alert('Please enter both your Supabase Project URL and Anon API Key.');
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
