import { supabase } from './supabaseClient';

export interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Función para obtener items de Stock reales
export async function syncStockItemsFromSupabase(): Promise<StockItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('chakra_stock_items')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching stock:', error);
    return [];
  }
  return data as StockItem[];
}

export async function createStockItemSupabase(item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<StockItem | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .insert([{
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        category: item.category,
        location: item.location,
        notes: item.notes
        // created_at/updated_at handled by DB default
      }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear item de stock:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en createStockItemSupabase:', error);
    return null;
  }
}

export async function updateStockQtySupabase(id: string, newQty: number): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('chakra_stock_items')
      .update({ qty: newQty, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar cantidad:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en updateStockQtySupabase:', error);
    return false;
  }
}

export async function deleteStockItemSupabase(id: string): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('chakra_stock_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en deleteStockItemSupabase:', error);
    return false;
  }
}

