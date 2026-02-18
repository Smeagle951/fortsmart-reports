import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Busca relatório por ID na tabela relatorios (coluna json_data).
 * @param {string} id - ID do relatório (ex: 2026-01-25-talhao16)
 * @returns {Promise<object|null>} linha com id, cliente_id, data_relatorio, json_data, created_at
 */
export async function getRelatorioById(id) {
  const { data, error } = await supabase
    .from('relatorios')
    .select('id, cliente_id, cliente, data_relatorio, json_data, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[fortsmart-reports] getRelatorioById error:', error.message);
    return null;
  }
  return data;
}

/**
 * Lista relatórios por cliente (histórico da propriedade).
 * @param {string} clienteId - Slug do cliente (ex: boa-esperanca) ou ID
 * @returns {Promise<Array>} lista de { id, cliente, data_relatorio, json_data, created_at }
 */
export async function getRelatoriosByClienteId(clienteId) {
  const { data, error } = await supabase
    .from('relatorios')
    .select('id, cliente_id, cliente, data_relatorio, json_data, created_at')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fortsmart-reports] getRelatoriosByClienteId error:', error.message);
    return [];
  }
  return data || [];
}
