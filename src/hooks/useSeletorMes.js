import { useState, useCallback } from 'react';
import { formatarAnoMes } from '../lib/utils';

/**
 * Estado do mês atual (YYYY-MM ou null = todos os meses)
 * Padrão: null (todos os meses); foca em um mês só se o usuário escolher.
 */
export function useSeletorMes(mesInicial) {
  const [mesAtual, setMesAtual] = useState(mesInicial ?? null);
  const [pickerAberto, setPickerAberto] = useState(false);

  const aoMudarMes = useCallback((novoMesOuAno, indiceMes) => {
    const novo = typeof indiceMes === 'number' && novoMesOuAno != null
      ? formatarAnoMes(String(novoMesOuAno), indiceMes)
      : novoMesOuAno;
    if (novo !== undefined) setMesAtual(novo);
    setPickerAberto(false);
  }, []);

  const aoAbrirFecharPicker = useCallback(() => {
    setPickerAberto((prev) => !prev);
  }, []);

  return { mesAtual, setMesAtual, pickerAberto, aoMudarMes, aoAbrirFecharPicker };
}
