---
name: ""
overview: ""
todos: []
isProject: false
---

# Plano SaaS: o que adicionar e o que melhorar

Visão do que falta para o projeto se comportar e escalar como um SaaS completo (cadastro aberto, segurança, opcionalmente cobrança e landing).

---

## Parte 1 — O que ADICIONAR (ainda não existe)

### 1.1 Cadastro público (registro de novos usuários)

- **Backend:** Nova rota `POST /auth/register` em [server/server.js](server/server.js).
  - Body: `{ email, password, nome }`.
  - Validar e-mail não duplicado (ler `auth-users.json`, checar por email).
  - Hash da senha com bcrypt, gerar `id` único (ex.: `user-${Date.now()}` ou uuid), salvar em `auth-users.json`.
  - Retornar 201 + JWT e `user` (mesmo contrato do login), ou 400 se e-mail já existe / dados inválidos.
- **Front:** Nova tela "Criar conta" (ou link na tela de login).
  - Formulário: e-mail, senha, confirmação de senha, nome (opcional).
  - Submit chama `POST /auth/register`; em sucesso faz login (guardar token e redirecionar para o app).
  - Link "Já tem conta? Entrar" que leva à tela de login.
- **Front (auth.js):** Função `register(email, password, nome)` que chama a API e, em sucesso, chama `setToken` e retorna `user`.

### 1.2 Landing / página pública (antes do login)

- Hoje o app vai direto para login ou painel; não há página de apresentação do produto.
- **Adicionar:** Uma landing mínima (pode ser uma rota ou condição no mesmo app).
  - Conteúdo: nome do produto, frase de valor, botões "Entrar" e "Criar conta".
  - "Entrar" leva à tela de login; "Criar conta" à tela de cadastro.
  - Quem já está logado pode ser redirecionado direto para o app (já existe o gate em App.jsx).
- **Implementação:** Opção A) Rota pública no React (ex.: `/` = landing, `/login`, `/criar-conta`) com React Router. Opção B) Página estática separada (ex.: `landing.html`) e links para o SPA. A opção A integra melhor com o gate de auth.

### 1.3 Recuperação de senha ("Esqueci a senha")

- **Backend:** `POST /auth/forgot-password` (recebe e-mail) e `POST /auth/reset-password` (recebe token + nova senha).
  - Depende de envio de e-mail (SMTP, SendGrid, Resend, etc.). Sem serviço de e-mail, não dá para fazer de forma segura.
- **Front:** Na tela de login, link "Esqueceu a senha?" que abre fluxo: digitar e-mail → mensagem "Se o e-mail existir, enviaremos um link" → (futuro) tela de nova senha com token.
- **Prioridade:** Pode ficar como "Fase 2" se ainda não houver integração de e-mail.

### 1.4 Billing / assinatura (planos pagos)

- Não existe hoje; é o que diferencia um SaaS comercial.
- **Adicionar (quando for o momento):**
  - Definição de planos (ex.: Free, Pro, Enterprise) e limites (ex.: número de transações, contas).
  - Integração com gateway (ex.: Stripe): checkout, webhook de renovação/cancelamento.
  - No backend: associar usuário a um plano (campo em `auth-users` ou tabela de assinaturas) e validar limites nas rotas críticas (ex.: sync, criação de dados).
  - No front: página "Planos" ou "Assinatura", exibição do plano atual e upgrade/downgrade.
- **Prioridade:** Típico de fase 2; o plano atual pode apenas listar "Billing (Stripe)" como item futuro.

### 1.5 Termos de uso e Política de privacidade

- Para SaaS comercial e LGPD/GDPR, é comum ter links no rodapé da landing e do login/cadastro.
- **Adicionar:** Páginas estáticas ou rotas (ex.: `/termos`, `/privacidade`) com texto legal, e links no login/cadastro/landing. Pode ser markdown renderizado ou HTML simples.

### 1.6 Segurança e resiliência no backend

- **Rate limiting:** Limitar requisições por IP (ou por token) em rotas de auth e sync para evitar abuso e força bruta. Ex.: middleware `express-rate-limit` em `/auth/login`, `/auth/register`, `/sync`.
- **CORS:** Hoje provavelmente aberto (`cors()` sem opções). Em produção, restringir `origin` às URLs do front (ex.: `https://app.vertexads.com`).
- **Helmet (opcional):** Usar `helmet()` no Express para headers de segurança (X-Content-Type-Options, etc.).
- **Variáveis de ambiente:** Garantir `JWT_SECRET` em produção; documentar no `.env.example` variáveis de produção (CORS_ORIGIN, RATE_LIMIT_*, etc.).

---

## Parte 2 — O que MELHORAR (já existe, mas pode evoluir)

### 2.1 Persistência: de arquivos para banco de dados

- **Hoje:** Usuários em `auth-users.json` e dados por usuário em `sync-store-{userId}.json`. Funciona para poucos usuários e um único servidor.
- **Melhoria:** Para escalar e ter backups/transações consistentes, migrar para um banco (ex.: SQLite para começar, depois Postgres).
  - Tabelas: `users` (id, email, password_hash, nome, created_at, plan?), `sync_data` ou uma tabela por tipo (transacoes, recorrentes, config) com `user_id`.
  - O servidor passa a usar o DB em vez de ler/escrever JSON. Migração: script que lê os JSON atuais e popula o banco.

### 2.2 Experiência no primeiro acesso (onboarding)

- **Melhoria:** Após o primeiro login (ou primeiro cadastro), exibir um passo a passo curto: "Adicione sua primeira conta", "Crie uma categoria", "Registre um lançamento", ou um tour rápido pela interface. Reduz abandono e melhora adoção.

### 2.3 Mensagens de erro e feedback

- **Melhoria:** Padronizar mensagens de erro da API (campos, códigos) e no front exibir textos claros (ex.: "E-mail já cadastrado", "Senha deve ter no mínimo 8 caracteres"). Loading states consistentes em login e cadastro.

### 2.4 JWT: refresh e revogação (opcional)

- **Hoje:** Token com validade longa (7d); não há refresh nem lista de tokens revogados.
- **Melhoria (opcional):** Refresh token armazenado no backend; acesso com access token curto; revogação ao fazer logout (invalidar refresh). Aumenta segurança em troca de mais complexidade.

### 2.5 Tauri (app desktop)

- **Melhoria:** Garantir que o app Tauri use o mesmo backend (auth + sync). Login no desktop deve abrir browser ou webview para o mesmo domínio da API, ou fluxo OAuth/device code, para que o usuário logue uma vez e o app use o mesmo JWT/sync. Documentar no README ou no plano de deploy.

### 2.6 Documentação e deploy

- **Melhoria:** README com passos para rodar front + backend em dev e em produção. `.env.example` completo (front e server), incluindo CORS, JWT_SECRET, e no futuro variáveis de e-mail e Stripe. Lista de requisitos para produção (HTTPS, backup do banco, etc.).

---

## Resumo em lista

**Adicionar**

1. Cadastro público: `POST /auth/register` + tela "Criar conta" + `register()` no auth.js.
2. Landing pública com "Entrar" e "Criar conta".
3. Recuperação de senha (quando houver envio de e-mail).
4. Billing/planos (Stripe ou similar) — fase 2.
5. Termos de uso e Política de privacidade (links + páginas).
6. Rate limiting, CORS restrito e opcionalmente Helmet no backend.

**Melhorar**

1. Migrar usuários e sync de JSON para banco (SQLite/Postgres).
2. Onboarding no primeiro acesso.
3. Mensagens de erro e loading padronizados.
4. (Opcional) Refresh token e revogação de sessão.
5. Fluxo de login no Tauri alinhado ao mesmo backend.
6. README e .env.example completos para deploy em produção.

---

## Ordem sugerida de execução

1. **Cadastro + landing** — permitem "qualquer um criar conta" e ter uma porta de entrada (SaaS mínimo).
2. **Rate limit + CORS** — proteção básica antes de divulgar.
3. **Termos e Privacidade** — links e textos mínimos.
4. **Recuperação de senha** — quando tiver e-mail configurado.
5. **Banco de dados** — quando o número de usuários ou a confiabilidade exigir.
6. **Billing** — quando decidir monetizar.
7. **Onboarding e UX** — contínuo.

