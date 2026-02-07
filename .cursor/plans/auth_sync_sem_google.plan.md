# Plano: Auth, logout e sync por usuário (sem Google)

Escopo: melhorias de autenticação e isolamento de dados por conta. Login com Google fica fora deste plano.

---

## 1. Sync por usuário no backend

**Objetivo:** Cada usuário (conta/e-mail) ter seus próprios dados de sync — comportamento SaaS.

**Arquivo:** [server/server.js](server/server.js)

- **Store por usuário:** Trocar o arquivo único `sync-store.json` por um store por `userId`.
  - Opção simples: um arquivo por usuário, ex. `sync-store-{userId}.json` (ex.: `sync-store-user-1.json`).
  - Funções `readStore(userId)` e `writeStore(userId, data)`. Se o arquivo não existir, retornar estrutura vazia (transacoes: [], recorrentes: [], config: {}).

- **Proteger rotas de sync:** Aplicar `authMiddleware` em `GET /sync` e `POST /sync`. Obter `req.user.userId` após o middleware e usar em todas as leituras/escritas do store. Respostas 401 se não houver token válido.

- **Migração:** Se já existir `sync-store.json` (dados antigos sem usuário), definir regra: por exemplo criar `sync-store-user-1.json` com o conteúdo atual e depois usar só stores por userId, ou documentar que em nova instalação não há migração.

---

## 2. Botão Sair (logout)

**Objetivo:** Usuário conseguir deslogar pela interface.

- **Onde:** [src/componentes/layout/BarraLateral.jsx](src/componentes/layout/BarraLateral.jsx). A barra já está dentro de `ProviderAuth`, então pode usar `useAuth()`.

- **Implementação:** Adicionar no final da navegação (ou em uma área inferior da sidebar) um botão "Sair" que chama `logout()` do `useAuth()`. Opcional: exibir e-mail ou nome do usuário (via `useAuth().user`) junto ao botão.

---

## 3. Link "Esqueceu?" na tela de login

**Objetivo:** Evitar expectativa de recuperação de senha sem implementar o fluxo.

- **Arquivo:** [src/app/Login.jsx](src/app/Login.jsx) (botão "Esqueceu?" ~linha 106).

- **Opção A (recomendada):** Remover o botão "Esqueceu?".

- **Opção B:** Manter o botão mas desabilitado com título/tooltip "Em breve" (sem ação de recuperação).

---

## 4. Produção — JWT_SECRET

- Já documentado em [.env.example](.env.example). Em produção, definir a variável `JWT_SECRET` no ambiente do servidor (não depender do fallback de dev). Nenhuma alteração de código; apenas checklist de deploy.

---

## Ordem sugerida

1. Backend: store por userId + proteger GET/POST `/sync` com `authMiddleware`.
2. Front: botão Sair na barra lateral.
3. Front: remover ou desabilitar "Esqueceu?" na tela de login.
4. Deploy: conferir `JWT_SECRET` em produção.

---

## Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| [server/server.js](server/server.js) | Store por userId; authMiddleware em GET/POST /sync; readStore(writeStore) com parâmetro userId |
| [src/componentes/layout/BarraLateral.jsx](src/componentes/layout/BarraLateral.jsx) | useAuth(), botão Sair (opcional: exibir user) |
| [src/app/Login.jsx](src/app/Login.jsx) | Remover ou desabilitar botão "Esqueceu?" |
