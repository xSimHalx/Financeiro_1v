import { useState, useCallback } from 'react';

const API_URL = (import.meta.env.VITE_CLOUD_API_URL || 'https://interested-accessories-recognition-elections.trycloudflare.com').replace(/\/$/, '');

/**
 * Hook para verificar se o app está se comunicando com o servidor.
 * Retorna { status, verificar, checking } onde:
 * - status: 'ok' | 'erro' | null (nunca verificou)
 * - verificar: função para testar a conexão
 * - checking: boolean indicando se está verificando
 */
export function useServerStatus() {
  const [status, setStatus] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [checking, setChecking] = useState(false);

  const verificar = useCallback(async () => {
    if (!API_URL) {
      setStatus('erro');
      setMensagem('API não configurada (VITE_CLOUD_API_URL vazio)');
      return;
    }
    setChecking(true);
    setStatus(null);
    setMensagem('');
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/health`, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStatus('ok');
        setMensagem(`Servidor em ${API_URL} respondeu OK`);
      } else {
        setStatus('erro');
        setMensagem(`Servidor retornou ${res.status}`);
      }
    } catch (e) {
      setStatus('erro');
      setMensagem(e?.message || 'Falha ao conectar. Verifique se o servidor está rodando (npm start na pasta server).');
    } finally {
      setChecking(false);
    }
  }, []);

  return { status, mensagem, verificar, checking, apiUrl: API_URL };
}
