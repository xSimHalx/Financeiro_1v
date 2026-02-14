# Checklist Deploy Netlify

## Antes do deploy

1. **Environment variables** (Site configuration → Environment variables)
   - `VITE_API_URL` = `https://api.simhal.tech`
   - Remova `VITE_CLOUD_API_URL` se existir (obsoleto)
   - (Opcional) `VITE_PWA_ENABLED` = `false` para desabilitar Service Worker e evitar cache antigo

2. **Commit e push**
   - Confirme que o código está atualizado no repositório conectado

## Deploy

3. **Clear cache and deploy**
   - Deploys → Trigger deploy → **Clear cache and deploy site**

4. **Após o deploy**
   - Anote o commit hash do deploy
   - Teste login em janela anônima ou após limpar dados do site

## Se usuários ainda veem versão antiga

5. **Service Worker (PWA)**
   - O app tem botão "Corrigir sync (recarregar)" em Configurações
   - Ou: DevTools → Application → Service Workers → Unregister
   - Ou: Application → Storage → Clear site data

6. **Build sem PWA** (evita SW)
   - Defina `VITE_PWA_ENABLED=false` nas env vars do Netlify
   - Faça novo deploy com Clear cache
