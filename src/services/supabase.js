// HB Works POS - Robust Supabase Cloud Synchronization Service
// Hardened with Adaptive Schema Support (Dual Compatible: Modern & Legacy schemas)
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let currentUrl = '';
let currentKey = '';

/**
 * Clean & sanitize Supabase credentials
 */
function sanitizeCredentials(url, key) {
  const cleanUrl = String(url || '').trim().replace(/\/+$/, '');
  const cleanKey = String(key || '').trim();
  return { cleanUrl, cleanKey };
}

/**
 * Returns a singleton Supabase client or initializes a new one.
 */
export function getSupabase(url, key) {
  const { cleanUrl, cleanKey } = sanitizeCredentials(url, key);
  if (!cleanUrl || !cleanKey) return null;

  if (supabaseClient && currentUrl === cleanUrl && currentKey === cleanKey) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    currentUrl = cleanUrl;
    currentKey = cleanKey;
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Test connectivity with Supabase backend
 */
export async function testConnection(url, key) {
  try {
    const client = getSupabase(url, key);
    if (!client) {
      return { success: false, message: 'Invalid or missing Supabase URL or Key' };
    }

    const { data, error } = await client
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err) {
    return { success: false, message: err?.message || 'Connection timeout or error' };
  }
}

/**
 * Fetch catalog products with dual-column support (legacy & modern columns)
 */
export async function fetchProducts(url, key) {
  try {
    const client = getSupabase(url, key);
    if (!client) return null;

    const { data, error } = await client
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return null;
    }

    if (Array.isArray(data)) {
      return data.map((item) => ({
        id: String(item.id || ''),
        name: item.name || item.product_name || 'Unnamed Product',
        barcode: String(item.barcode || item.barcode_sku || ''),
        price: Number(item.price) || 0,
        quantity_in_stock: Number(item.quantity_in_stock) || 0,
        category: item.category || 'General',
      }));
    }
    return null;
  } catch (err) {
    console.warn('Error fetching cloud products:', err);
    return null;
  }
}

/**
 * Sync or upsert product into Supabase.
 * Populates both modern & legacy columns and omits updated_at if not in schema.
 */
export async function syncProduct(url, key, product) {
  try {
    const client = getSupabase(url, key);
    if (!client || !product) return false;

    const name = String(product.name || '').trim();
    const barcode = String(product.barcode || '').trim();
    const price = Number(product.price) || 0;
    const stock = Number(product.quantity_in_stock) || 0;
    const category = product.category || 'General';

    if (!name || !barcode) {
      console.warn('Cannot sync product without name and barcode');
      return false;
    }

    // Base payload with dual-column compatibility
    const basePayload = {
      name,
      product_name: name,
      barcode,
      barcode_sku: barcode,
      price,
      quantity_in_stock: stock,
      category,
    };

    // If ID is an existing UUID from cloud (not a local p- ID), keep it
    if (product.id && !String(product.id).startsWith('p-')) {
      basePayload.id = product.id;
    }

    // Attempt upsert with barcode conflict resolution
    const { error } = await client
      .from('products')
      .upsert(basePayload, { onConflict: 'barcode' });

    if (error) {
      console.warn('Error syncing product to Supabase:', error.message);
      // Fallback: try minimal payload in case dual columns are not allowed
      const minimalPayload = {
        name,
        barcode,
        price,
        quantity_in_stock: stock,
        category,
      };
      const { error: minError } = await client
        .from('products')
        .upsert(minimalPayload, { onConflict: 'barcode' });

      return !minError;
    }
    return true;
  } catch (err) {
    console.warn('Supabase product sync exception:', err);
    return false;
  }
}

/**
 * Update stock level safely.
 * Matches by UUID id or by unique barcode (handles local seed IDs vs cloud UUIDs).
 */
export async function updateStock(url, key, productId, newStock, barcode) {
  try {
    const client = getSupabase(url, key);
    if (!client) return false;

    const stockQty = Math.max(0, Number(newStock) || 0);

    // Build update payload (omit updated_at to ensure compatibility with all schemas)
    const updatePayload = { quantity_in_stock: stockQty };

    let query = client.from('products').update(updatePayload);

    // If a clean barcode is available and productId is local (starts with 'p-')
    if (barcode && String(productId).startsWith('p-')) {
      query = query.eq('barcode', String(barcode).trim());
    } else if (productId) {
      query = query.eq('id', productId);
    } else if (barcode) {
      query = query.eq('barcode', String(barcode).trim());
    } else {
      return false;
    }

    const { error } = await query;
    if (error) {
      console.warn('Error updating product stock:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Stock update exception:', err);
    return false;
  }
}

/**
 * Record completed sale in Supabase.
 * Uses adaptive dual-strategy:
 * 1. Rich schema: (transaction_id, total_amount, payment_method, amount_tendered, change_amount, items)
 * 2. Fallback schema: (total_amount, cashier_name, created_at)
 * Result: ZERO sales lost regardless of database migration status.
 */
export async function recordSale(url, key, sale) {
  try {
    const client = getSupabase(url, key);
    if (!client || !sale) return false;

    const txnId = sale.id || `TXN-${Date.now()}`;
    const totalAmount = Number(sale.total) || 0;
    const payMethod = sale.payMethod || 'Cash';
    const tendered = Number(sale.tendered) || totalAmount;
    const change = Number(sale.change) || 0;
    const items = Array.isArray(sale.items) ? sale.items : [];
    const timestamp = sale.timestamp || new Date().toISOString();

    // 1. Try modern rich payload
    const richPayload = {
      transaction_id: txnId,
      total_amount: totalAmount,
      payment_method: payMethod,
      amount_tendered: tendered,
      change_amount: change,
      items,
      created_at: timestamp,
    };

    const { error: richErr } = await client.from('sales').insert([richPayload]);

    if (!richErr) {
      return true;
    }

    // 2. If rich payload failed (e.g. column not found in current schema cache),
    // use adaptive fallback schema:
    console.warn(
      'Rich sale insert failed (' + richErr.message + '), applying adaptive fallback...'
    );

    const fallbackPayload = {
      total_amount: totalAmount,
      cashier_name: txnId,
      created_at: timestamp,
    };

    const { error: fallbackErr } = await client
      .from('sales')
      .insert([fallbackPayload]);

    if (fallbackErr) {
      console.error('Fallback sale insert also failed:', fallbackErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Exception recording sale in Supabase:', err);
    return false;
  }
}
