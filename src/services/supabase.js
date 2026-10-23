// HB Works POS - Supabase Cloud Synchronization Service
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let currentUrl = '';
let currentKey = '';

export function getSupabase(url, key) {
  if (supabaseClient && currentUrl === url && currentKey === key) {
    return supabaseClient;
  }
  if (!url || !key) return null;

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    currentUrl = url;
    currentKey = key;
    return supabaseClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testConnection(url, key) {
  try {
    const client = getSupabase(url, key);
    if (!client) return { success: false, message: 'Invalid URL or Key' };

    const { data, error } = await client
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err) {
    return { success: false, message: err.message || 'Connection error' };
  }
}

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
        id: String(item.id),
        name: item.name || 'Unnamed Product',
        barcode: String(item.barcode || ''),
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

export async function syncProduct(url, key, product) {
  try {
    const client = getSupabase(url, key);
    if (!client) return false;

    const payload = {
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
      category: product.category || 'General',
      updated_at: new Date().toISOString(),
    };

    if (product.id && !product.id.startsWith('p-temp-')) {
      payload.id = product.id;
    }

    const { error } = await client
      .from('products')
      .upsert(payload, { onConflict: 'barcode' });

    if (error) {
      console.warn('Error syncing product:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase product sync exception:', err);
    return false;
  }
}

export async function updateStock(url, key, productId, newStock) {
  try {
    const client = getSupabase(url, key);
    if (!client) return false;

    const { error } = await client
      .from('products')
      .update({ quantity_in_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId);

    return !error;
  } catch (err) {
    return false;
  }
}

export async function recordSale(url, key, sale) {
  try {
    const client = getSupabase(url, key);
    if (!client) return false;

    const payload = {
      transaction_id: sale.id,
      total_amount: sale.total,
      payment_method: sale.payMethod || 'Cash',
      amount_tendered: sale.tendered || sale.total,
      change_amount: sale.change || 0,
      items: sale.items || [],
      created_at: sale.timestamp || new Date().toISOString(),
    };

    const { error } = await client.from('sales').insert([payload]);
    if (error) {
      console.warn('Error recording sale in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception recording sale:', err);
    return false;
  }
}
