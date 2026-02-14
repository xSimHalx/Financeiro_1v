import { useState, useCallback } from 'react';
import { checkHealth, API_URL } from '../services/api.js';

/**
 * Hook para verificar se o app está se comunicando com o servidor.
 * Retorna { status, mensagem, verificar, checking, apiUrl }.
 */
export function useServerStatus() {
  const [status, setStatus] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [checking, setChecking] = useState(false);

  const verificar = useCallback(async () => {
    if (!API_URL) {
      setStatus('erro');
      setMensagem('API não configurada (VITE_API_URL vazio)');
      return;
    }
    setChecking(true);
    setStatus(null);
    setMensagem('');
    try {
      const result = await checkHealth();
      if (result.ok) {
        setStatus('ok');
        setMensagem(`Servidor em ${API_URL} respondeu OK`);
      } else {
        setStatus('erro');
        setMensagem(result.error || 'Falha ao conectar');
      }
    } finally {
      setChecking(false);
    }
  }, []);

  return { status, mensagem, verificar, checking, apiUrl: API_URL };
}
