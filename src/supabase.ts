import { createClient } from '@supabase/supabase-js';
import { Transaction, Category } from './types';

// Supabase client initialization.
// The anon key is safe for client-side usage when Row Level Security (RLS) is configured.
const SUPABASE_URL = 'https://ofkiuffheubxfjxzwucs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2l1ZmZoZXVieGZqeHp3dWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2OTYwOTksImV4cCI6MjA5ODI3MjA5OX0.oA1kgE-kMe5ll1A93BJsMDdbCbnQx1Z2qgLf7JJeTjs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Map DB Category to standard interface
 */
function mapDbCategory(item: any): Category {
  return {
    id: item.id,
    created_at: item.created_at,
    name: item.name || item.ten || '',
    type: item.owner || item.type || item.loai || 'chung'
  };
}

/**
 * Get Fallback Categories
 */
export function getFallbackCategories(): Category[] {
  return [
    { id: 'fb-1', name: 'Cá nhân', type: 'chung' },
    { id: 'fb-2', name: 'Quỹ ăn nhậu', type: 'chung' },
    { id: 'fb-3', name: 'Quỹ sinh hoạt', type: 'chung' }
  ];
}

/**
 * Helper to fetch transactions from the database
 */
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  // Map database fields to our Transaction type to support both English & possible Vietnamese column naming
  return (data || []).map((item: any) => {
    return {
      id: item.id,
      created_at: item.created_at,
      spender: item.spender || item.nguoi_chi || 'Hoàng',
      category: item.category || item.hang_muc || 'Cá nhân',
      amount: Number(item.amount !== undefined ? item.amount : (item.so_tien || 0)),
      notes: item.notes !== undefined ? item.notes : (item.ghi_chu || item.note || ''),
      image_url: item.image_url || item.receipt_url || item.link_anh || item.image || undefined,
      transaction_type: item.transaction_type || item.loai_giao_dich || item.loai_gd || item.type || 'chi'
    };
  });
}

/**
 * Helper to insert a transaction into the database
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<any> {
  // Use verified active columns as default in case the table is empty and we can't inspect sample row keys
  let keys: string[] = ['id', 'created_at', 'spender', 'category', 'amount', 'note', 'image_url', 'transaction_type'];
  try {
    const { data } = await supabase.from('transactions').select('*').limit(1);
    if (data && data[0]) {
      keys = Object.keys(data[0]);
    }
  } catch (e) {
    console.warn('Error fetching sample row for keys:', e);
  }

  const hasCol = (col: string) => keys.includes(col);

  const payload: any = {};
  
  // Map Spender
  if (hasCol('spender')) payload.spender = transaction.spender;
  else if (hasCol('nguoi_chi')) payload.nguoi_chi = transaction.spender;
  else payload.spender = transaction.spender;

  // Map Category
  if (hasCol('category')) payload.category = transaction.category;
  else if (hasCol('hang_muc')) payload.hang_muc = transaction.category;
  else payload.category = transaction.category;

  // Map Amount
  if (hasCol('amount')) payload.amount = transaction.amount;
  else if (hasCol('so_tien')) payload.so_tien = transaction.amount;
  else payload.amount = transaction.amount;

  // Map Notes
  if (hasCol('note')) payload.note = transaction.notes;
  else if (hasCol('notes')) payload.notes = transaction.notes;
  else if (hasCol('ghi_chu')) payload.ghi_chu = transaction.notes;
  else payload.note = transaction.notes;

  // Map Image URL
  if (hasCol('image_url')) payload.image_url = transaction.image_url || null;
  else if (hasCol('link_anh')) payload.link_anh = transaction.image_url || null;
  else if (hasCol('receipt_url')) payload.receipt_url = transaction.image_url || null;
  else payload.image_url = transaction.image_url || null;

  // Map Transaction Type
  const typeVal = transaction.transaction_type || 'chi';
  if (hasCol('transaction_type')) payload.transaction_type = typeVal;
  else if (hasCol('loai_giao_dich')) payload.loai_giao_dich = typeVal;
  else if (hasCol('loai_gd')) payload.loai_gd = typeVal;
  else if (hasCol('type')) payload.type = typeVal;
  else payload.transaction_type = typeVal;

  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select();

  if (error) {
    console.error('Transaction insert failed:', error);
    throw error;
  }

  return data;
}

/**
 * Helper to delete a transaction from the database
 */
export async function deleteTransaction(id: string | number): Promise<any> {
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
  return data;
}

/**
 * Helper to fetch categories from Supabase
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching categories from Supabase:', error);
    return getFallbackCategories();
  }

  if (!data || data.length === 0) {
    // Return standard defaults if the database table is empty
    return getFallbackCategories();
  }

  return data.map(mapDbCategory);
}

/**
 * Helper to add a category into the database
 */
export async function addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
  // Use verified active columns as default in case the table is empty and we can't inspect sample row keys
  let keys: string[] = ['id', 'created_at', 'name', 'owner'];
  try {
    const { data } = await supabase.from('categories').select('*').limit(1);
    if (data && data[0]) {
      keys = Object.keys(data[0]);
    }
  } catch (e) {
    console.warn('Error fetching sample row for categories keys:', e);
  }

  const hasCol = (col: string) => keys.includes(col);

  const payload: any = {};
  
  // Map Name
  if (hasCol('name')) payload.name = category.name;
  else if (hasCol('ten')) payload.ten = category.name;
  else payload.name = category.name; // fallback

  // Map Type / Owner / Loai
  if (hasCol('owner')) payload.owner = category.type;
  else if (hasCol('type')) payload.type = category.type;
  else if (hasCol('loai')) payload.loai = category.type;
  else payload.owner = category.type; // fallback

  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select();

  if (error) {
    console.error('Category insert failed:', error);
    throw error;
  }

  return mapDbCategory(data[0]);
}

/**
 * Helper to update a category in the database
 */
export async function updateCategory(id: string | number, name: string, type: 'chung' | 'hoang' | 'uyen'): Promise<Category> {
  // Use verified active columns as default in case the table is empty and we can't inspect sample row keys
  let keys: string[] = ['id', 'created_at', 'name', 'owner'];
  try {
    const { data } = await supabase.from('categories').select('*').limit(1);
    if (data && data[0]) {
      keys = Object.keys(data[0]);
    }
  } catch (e) {
    console.warn('Error fetching sample row for categories keys:', e);
  }

  const hasCol = (col: string) => keys.includes(col);

  const payload: any = {};
  
  // Map Name
  if (hasCol('name')) payload.name = name;
  else if (hasCol('ten')) payload.ten = name;
  else payload.name = name; // fallback

  // Map Type / Owner / Loai
  if (hasCol('owner')) payload.owner = type;
  else if (hasCol('type')) payload.type = type;
  else if (hasCol('loai')) payload.loai = type;
  else payload.owner = type; // fallback

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Category update failed:', error);
    throw error;
  }

  return mapDbCategory(data[0]);
}

/**
 * Helper to delete a category from the database
 */
export async function deleteCategory(id: string | number): Promise<any> {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
  return data;
}

/**
 * Helper to upload a receipt photo to Supabase storage bucket `receipts`
 */
export async function uploadReceiptImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading receipt image to Supabase receipts bucket:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath);

  return publicUrl;
}
