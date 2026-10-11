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

export function initSupabaseClient() {
    SUPABASE_URL = localStorage.getItem('hb_pos_supabase_url') || DEFAULT_SUPABASE_URL;
    SUPABASE_ANON_KEY = localStorage.getItem('hb_pos_supabase_key') || DEFAULT_SUPABASE_KEY;

    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.createClient) {
        try {
            supabase = window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
            updateDbStatusUI(true, 'Connected to Cloud');
            pullProductsFromSupabase(true);
            return true;
        } catch (err) {
            console.error('Failed to init Supabase client:', err);
            updateDbStatusUI(false, 'Initialization Error');
            supabase = null;
            return false;
        }
    } else {
        supabase = null;
        updateDbStatusUI(false, 'Disconnected (Local Storage Only)');
        return false;
    }
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
            setProducts(data);
            if (onProductsUpdatedCallback) onProductsUpdatedCallback();
            updateDbStatusUI(true, `Connected (${data.length} products synced)`);
            if (!silent && showToastFn) showToastFn(`Synced ${data.length} products from cloud!`);
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
    if (!supabase) {
        if (showToastFn) showToastFn('Supabase not connected');
        return;
    }

    try {
        if (showToastFn) showToastFn('Uploading products to cloud...');
        const payload = products.map(p => ({
            name: p.name,
            barcode: p.barcode,
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

export async function findProductInSupabase(barcode) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', barcode)
            .single();

        if (!error && data) {
            if (!products.some(p => p.id === data.id || p.barcode === data.barcode)) {
                products.push(data);
                saveLocalState();
            }
            return data;
        }
    } catch (err) {
        console.error('Supabase product lookup error:', err);
    }
    return null;
}

export async function syncSaleToSupabase(saleRecord, cartItems) {
    if (!supabase) return;
    try {
        await supabase.from('sales').insert([{
            transaction_id: saleRecord.id,
            total_amount: saleRecord.total,
            payment_method: saleRecord.payMethod,
            amount_tendered: saleRecord.tendered,
            change_amount: saleRecord.change,
            items: saleRecord.items
        }]);

        for (const cartItem of cartItems) {
            const prod = products.find(p => p.id === cartItem.id || p.barcode === cartItem.barcode);
            if (prod) {
                await supabase.from('products')
                    .update({ quantity_in_stock: prod.quantity_in_stock })
                    .eq('barcode', prod.barcode);
            }
        }
    } catch (dbErr) {
        console.warn('Supabase sync warning (stored locally):', dbErr);
    }
}

export async function syncStockToSupabase(productData) {
    if (!supabase) return;
    try {
        await supabase.from('products').upsert([{
            name: productData.name,
            barcode: productData.barcode,
            price: productData.price,
            quantity_in_stock: productData.quantity_in_stock
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
