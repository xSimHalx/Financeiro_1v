/**
 * Constantes do sistema (Empresa/Pessoal, métodos de pagamento, etc.)
 */

/** Contextos de lançamento: Empresa ou Pessoal */
export const CONTEXTOS = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'pessoal', label: 'Pessoal' }
];

/** Opções de contraparte para transferências entre Empresa e Pessoal */
export const CONTROPARTE_OPCOES = [
  { id: null, label: 'Nenhum (lançamento normal)' },
  { id: 'empresa', label: 'Empresa' },
  { id: 'pessoal', label: 'Pessoal' }
];

/** Métodos de pagamento disponíveis */
export const METODOS_PAGAMENTO = [
  { id: 'pix', label: 'Pix' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'boleto', label: 'Boleto' },
  { id: 'transferencia', label: 'Transferência' }
];

/** Status possíveis de um lançamento */
export const STATUS_LANCAMENTO = [
  { id: 'pago', label: 'Pago' },
  { id: 'previsto', label: 'Previsto' }
];

/** Tipos de fluxo */
export const TIPOS_FLUXO = [
  { id: 'entrada', label: 'Receita' },
  { id: 'saida', label: 'Despesa' }
];
