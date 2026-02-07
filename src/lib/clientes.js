/**
 * Helpers para clientes (normalização de string[] para objeto com nome, telefone, endereco)
 */

/**
 * Gera id estável a partir do nome (para migração de clientes antigos)
 */
export function slugCliente(nome) {
  return (nome || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'c';
}

/**
 * Normaliza array de clientes: strings viram { id, nome, telefone, endereco }
 * @param {Array<string|object>} arr
 * @returns {Array<{ id: string, nome: string, telefone: string, endereco: string }>}
 */
export function normalizeClientes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => {
    if (typeof c === 'string') {
      return { id: slugCliente(c), nome: c, telefone: '', endereco: '' };
    }
    return {
      id: c.id || slugCliente(c.nome),
      nome: c.nome || '',
      telefone: c.telefone || '',
      endereco: c.endereco || ''
    };
  });
}
