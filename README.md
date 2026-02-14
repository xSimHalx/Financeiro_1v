# VertexAds Financeiro

Sistema de controle financeiro **offline-first** com sincronização na nuvem. Disponível como **PWA** (web), **app desktop** (Tauri para Windows/macOS) e **API REST** para sincronização.

---

## Índice

- [Visão geral](#visão-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Executando o projeto](#executando-o-projeto)
- [Build e distribuição](#build-e-distribuição)
- [API e sincronização](#api-e-sincronização)
- [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Visão geral

O VertexAds Financeiro permite gerenciar transações, recorrências, contas e clientes, com contexto separado entre **Empresa** e **Pessoal**. Os dados funcionam offline e são sincronizados com um servidor quando há conexão.

### Modos de execução

| Modo | Banco de dados | Sync |
|------|----------------|------|
| **PWA (navegador)** | IndexedDB (Dexie.js) | API REST (pull ao abrir, push ao fechar) |
| **Desktop (Tauri)** | SQLite (rusqlite) | API REST (pull ao abrir, push ao fechar janela) |

---

## Stack tecnológica

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.x | UI |
| **Vite** | 5.x | Build e dev server |
| **React Router** | 7.x | Rotas |
| **Tailwind CSS** | 3.x | Estilos |
| **Lucide React** | 0.294 | Ícones |
| **Recharts** | 3.x | Gráficos |
| **Dexie.js** | 4.x | IndexedDB (PWA) |

### Desktop (Tauri)

| Tecnologia | Uso |
|------------|-----|
| **Tauri** | 2.x – shell nativo (Windows/macOS) |
| **Rust** | Backend (rusqlite, reqwest, serde) |
| **rusqlite** | SQLite embutido |
| **reqwest** | HTTP para sync |

### Servidor (API)

| Tecnologia | Uso |
|------------|-----|
| **Express** | API REST |
| **better-sqlite3** | Persistência local (SQLite) |
| **bcrypt** | Hash de senhas |
| **jsonwebtoken** | Autenticação JWT |
| **cors** | CORS |
| **helmet** | Segurança HTTP |
| **express-rate-limit** | Limite de requisições |

### DevOps

| Tecnologia | Uso |
|------------|-----|
| **Vite PWA Plugin** | Service Worker e manifest (PWA instalável) |
| **GitHub Actions** | CI/CD – build Windows e macOS |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ProviderAuth → ProviderApp → ProviderDados → Views              │
│  - Login/Register (auth.js)                                      │
│  - Dashboard, Transações, Recorrências, Contas, Clientes, etc.   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  PWA (IndexedDB/Dexie)  │     │  Tauri (invoke)         │
│  db.js, sync.js         │     │  src-tauri (Rust)       │
└─────────────────────────┘     │  SQLite + sync_pull/push│
              │                 └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                   ┌─────────────────────┐
                   │  API REST (server/) │
                   │  /auth, /sync       │
                   │  SQLite (storage/)  │
                   └─────────────────────┘
```

### Fluxo de dados

1. **Auth**: login/registro via API, token em `localStorage` ou `sessionStorage` (conforme “Lembrar dispositivo”).
2. **Carregamento**: transações, recorrências e config vêm do banco local (IndexedDB ou SQLite).
3. **Sync pull**: ao abrir o app, busca alterações desde `lastSyncedAt`.
4. **Sync push**: ao fechar o app (ou janela no Tauri), envia alterações locais para a API.

---

## Funcionalidades

### Módulos principais

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral, métricas, gráficos por categoria/método |
| **Livro Caixa** | Lista de transações com filtros, edição e lixeira |
| **Recorrências** | Parcelas recorrentes, projeção mensal |
| **Minhas Contas** | Saldos por conta |
| **Clientes** | Cadastro de clientes/fornecedores |
| **Investimentos** | Saldos em contas de investimento |
| **Lixeira** | Restaurar ou excluir transações definitivamente |
| **Configurações** | Categorias, contas, status, restore da nuvem |

### Contextos

- **Empresa** e **Pessoal**: transações separadas por contexto.
- **Transferências** entre contextos (ex.: saída Empresa → entrada Pessoal).

### Valores

- Valores armazenados em **centavos** (inteiros).
- Formatação em R$ via `formatarMoeda`, `centavosParaReais`, `reaisParaCentavos`.

### Datas

- Formato de exibição: **DD/MM/AAAA** (BR).
- Armazenamento: **YYYY-MM-DD** (ISO).

---

## Estrutura do projeto

```
Financeiro 2V/
├── src/
│   ├── app/              # App.jsx, Login, rotas, Termos, Privacidade
│   ├── componentes/      # UI (Input, InputMoeda, InputData, Select, etc.)
│   │   ├── layout/       # BarraLateral, Cabecalho, LayoutPrincipal, MenuMobile
│   │   └── compartilhados/ # BarraFiltros, SeletorMes, Onboarding
│   ├── funcionalidades/  # Views por módulo (painel, transacoes, recorrencias, etc.)
│   ├── hooks/            # useFiltros, useMetricasEmpresa, useSeletorMes
│   ├── lib/              # Lógica de negócio
│   │   ├── auth.js       # Login, registro, token (localStorage/sessionStorage)
│   │   ├── db.js         # Dexie/IndexedDB (PWA)
│   │   ├── sync.js       # pull/push para API, restore
│   │   ├── moeda.js      # centavos/reais
│   │   ├── contas.js     # lista de contas
│   │   ├── clientes.js   # normalização de clientes
│   │   └── formatadores.js
│   ├── store/            # Contextos React
│   │   ├── ProviderAuth.jsx
│   │   ├── ProviderDados.jsx
│   │   └── ContextoApp.jsx
│   └── main.jsx
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs        # Comandos Tauri (get_transacoes, put_transacao, sync_*)
│   │   ├── main.rs
│   │   └── db.rs         # SQLite (rusqlite)
│   ├── tauri.conf.json
│   └── Cargo.toml
├── server/
│   ├── server.js         # Express, registra rotas
│   ├── db.js             # SQLite (better-sqlite3), init e migração
│   ├── storage/          # db.sqlite (criado automaticamente)
│   ├── repos/            # usuariosRepo, syncRepo
│   ├── routes/           # auth, sync
│   └── middlewares/      # auth (JWT)
├── .github/workflows/
│   └── build.yml         # CI: build Windows + macOS
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Executando o projeto

### Pré-requisitos

- **Node.js** 18+ e **npm**
- Para app desktop: **Rust** (rustup), **Visual Studio Build Tools** (Windows) ou **Xcode Command Line Tools** (macOS)

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar frontend (PWA) em http://localhost:5173
npm run dev

# Para o botão "Baixar servidor" em Configurações funcionar, execute primeiro:
npm run zip-server

# Rodar API (em outro terminal)
cd server && npm install && npm start   # porta 3001

# Rodar app desktop (Tauri)
npm run tauri:dev
```

### Produção (web)

```bash
npm run build
npm run preview
```

### Deploy na Hostinger (site estático)

1. **Configurar variáveis de ambiente antes do build**
   - Copie `.env.production` ou defina `VITE_API_URL=https://simhal.tech` antes de rodar o build.

2. **Build de produção**
   ```bash
   npm install
   npm run build
   ```

3. **Enviar para o servidor**
   - Envie todo o conteúdo da pasta `dist/` para `public_html` (ou a pasta do site na Hostinger) via FTP/SFTP ou Gerenciador de Arquivos.

4. **SPA (rotas)**
   - Configure o servidor para redirecionar rotas desconhecidas para `index.html`. Na Hostinger, use `.htaccess`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

5. **Testar conectividade**
   - Abra o site e verifique o console (F12): deve aparecer `[API] OK – servidor acessível` se a API estiver respondendo.
   - Ou use Configurações → botão para verificar servidor.

### Testar /health

- No navegador: `https://simhal.tech/health` → deve retornar `{"ok":true,"ts":...,"timestamp":...}`.
- No terminal: `curl https://simhal.tech/health`.

### CORS e possíveis erros

| Erro | Causa | Solução |
|------|-------|---------|
| CORS blocked | Origin do front não está em `CORS_ORIGIN` | Adicione a URL do site (ex.: `https://paleturquoise-chough-748488.hostingersite.com`) em `server/.env` → `CORS_ORIGIN=...` |
| 401 Unauthorized | Token inválido ou expirado | Fazer login novamente |
| ERR_NAME_NOT_RESOLVED | URL da API incorreta | Verifique `VITE_API_URL` no build. Use `npm run build` com `.env.production` ou variável definida. |

---

## Build e distribuição

### PWA (web)

- Build: `npm run build`
- Saída em `dist/` com Service Worker e `manifest.webmanifest`
- Instalável no navegador

### App desktop (Tauri)

```bash
# Windows (requer PATH do Rust; use tauri:build:win se necessário)
npm run tauri:build
```

Instaladores gerados em:

- **Windows**: `src-tauri/target/release/bundle/nsis/*.exe` e `msi/*.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg` e `macos/*.app`

### Instalação no macOS (DMG)

1. Abra o arquivo `.dmg` (duplo clique).
2. Arraste o app para a pasta **Aplicativos**.
3. Ejecte o disco (clique no ícone do disco na barra lateral e em Ejectar).
4. Se aparecer **"está danificado"** ou **"não pode ser aberto"**:
   - Use **clique direito** no app → **Abrir** → **Abrir**; ou
   - No Terminal: `xattr -cr "/caminho/para/VertexAds Financeiro.app"` (substitua pelo caminho real).

### Rodar o Tauri com servidor local

```bash
# Windows (PowerShell)
$env:TAURI_APP_CLOUD_API_URL="http://localhost:3001"; npm run tauri dev

# macOS / Linux
TAURI_APP_CLOUD_API_URL="http://localhost:3001" npm run tauri dev
```

O servidor precisa estar rodando (`cd server && npm start`) e o `CORS_ORIGIN` em `server/.env` deve incluir a origem do app (ex.: `http://localhost:5173` em dev).

### GitHub Actions

- Workflow em `.github/workflows/build.yml`
- Disparo: push na branch `main` ou execução manual
- Jobs: `windows-latest` e `macos-latest`
- Artefatos: `windows-installer` e `macos-installer` em Actions → Artifacts

**URL da API no build:** Padrão `http://localhost:3001` (cada máquina tem app + servidor local). Para API remota, configure em **Settings** → **Secrets and variables** → **Actions** → **Variables** a variável `TAURI_APP_CLOUD_API_URL`.

---

## API e sincronização

### Autenticação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/login` | POST | `{ email, password }` → `{ token, user }` |
| `/auth/register` | POST | `{ email, password, nome }` → `{ token, user }` |
| `/auth/me` | GET | Header `Authorization: Bearer <token>` → `{ user }` |

### Sync

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/sync` | GET | Pull. Query `?since=ISO` opcional |
| `/sync` | POST | Push. Body: `{ transacoes, recorrentes, config }` |

### Modelo de dados

- **Transações**: `id`, `date`, `description`, `client`, `value` (centavos), `type` (entrada/saida), `contexto`, `contraparte`, `category`, `account`, `metodoPagamento`, `status`, `deleted`, `recorrenciaId`, `updatedAt`
- **Recorrências**: `id`, `titulo`, `valor`, `tipo`, `diaVencimento`, `frequencia`, `recorrente`, `categoria`, `conta`, etc.
- **Config**: `categorias`, `contas`, `contasInvestimento`, `clientes`, `statusLancamento`, `lastSyncedAt`

---

## Variáveis de ambiente

### Frontend

| Arquivo | Variável | Descrição |
|---------|----------|-----------|
| `.env` | `VITE_API_URL` | Dev: `http://localhost:3000` (ou 3001 conforme a porta do backend) |
| `.env.production` | `VITE_API_URL` | Prod: `https://simhal.tech` |

### Tauri (app desktop)

| Variável | Descrição |
|----------|-----------|
| `TAURI_APP_CLOUD_API_URL` | URL da API para sync (definir ao rodar ou no build). Ex.: `http://localhost:3001` |

### Servidor (`server/.env`)

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave para JWT (obrigatória em produção) |
| `CORS_ORIGIN` | Origens permitidas (ex.: `http://localhost:5173`) |
| `RATE_LIMIT_MAX_AUTH` | Limite de requisições em /auth |
| `RATE_LIMIT_MAX_SYNC` | Limite de requisições em /sync |

---

## Licença

Projeto privado – VertexAds.
