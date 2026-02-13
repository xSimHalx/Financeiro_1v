# VertexAds Sync + Auth API

Servidor Express para autenticação e sincronização do VertexAds Financeiro. Persistência local em SQLite.

## Executando (Mac / Windows / Linux)

```bash
cd server
npm install
npm start
```

O servidor inicia em `http://localhost:3001`.

### Download do app (Configurações)

No app, em **Configurações**, há o botão **Baixar servidor** que faz o download de um zip para instalar em outro PC. Execute `npm run zip-server` (ou `npm run build`) para gerar o zip antes de usar o download.

### Launchers (duplo clique)

- **Windows**: duplo clique em `start-server.bat`
- **Mac**: duplo clique em `start-server.command` (na primeira vez: botão direito → Abrir, ou no Terminal: `chmod +x start-server.command`)

### Iniciar automaticamente no boot (PM2)

```bash
npm install -g pm2
cd server
pm2 start server.js --name vertexads-server
pm2 save
pm2 startup   # segue as instruções exibidas (pode exigir admin/sudo)
```

Modo desenvolvimento com auto-reload:

```bash
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na pasta `server/`:

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave secreta para assinatura de JWTs. **Obrigatório em produção.** |
| `CORS_ORIGIN` | Origens permitidas pelo CORS, separadas por vírgula. Ex: `http://localhost:5173` ou `https://app.vertexads.com` |
| `PORT` | Porta do servidor (padrão: 3001) |
| `RATE_LIMIT_WINDOW_MS` | Janela do rate limit em ms (padrão: 900000 = 15 min) |
| `RATE_LIMIT_MAX_AUTH` | Máximo de requisições em /auth/login e /auth/register por janela (padrão: 20) |
| `RATE_LIMIT_MAX_SYNC` | Máximo de requisições em /sync por janela (padrão: 200) |

Exemplo `.env`:

```
PORT=3001
JWT_SECRET=sua-chave-secreta-forte-em-producao
CORS_ORIGIN=http://localhost:5173
```

## Estrutura

- `storage/db.sqlite` – Banco SQLite (criado automaticamente)
- `db.js` – Conexão e inicialização do schema
- `repos/usuariosRepo.js` – Usuários
- `repos/syncRepo.js` – Snapshots de sync
- `middlewares/auth.js` – Middleware JWT
- `routes/auth.js` – Rotas de autenticação
- `routes/sync.js` – Rotas de sincronização

## Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | `{ email, password }` → `{ token, user }` |
| POST | /auth/register | `{ email, password, nome }` → `{ token, user }` |
| GET | /auth/me | Header `Authorization: Bearer <token>` → `{ user }` |

### Sincronização

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /sync | Retorna snapshot do usuário. Query `?since=ISO` opcional (filtro incremental) |
| POST | /sync | Envia alterações. Body: `{ transacoes, recorrentes, config }` |
| POST | /api/report-error | Recebe erro do frontend e envia por email. Body: `{ message, stack, source, userAgent, timestamp }` |
| GET | /api/email/test | Envia email de teste para `EMAIL_ERRORS_TO` |

## Migração JSON → SQLite

Na primeira execução, se existirem `auth-users.json` e `sync-store-*.json`, os dados são importados automaticamente para o SQLite. Um arquivo `.migrated-to-sqlite` é criado para evitar nova migração.

## Testes com curl

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vertexads.com","password":"admin123"}'

# GET /sync (use o token retornado)
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/sync

# POST /sync
curl -X POST http://localhost:3001/sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transacoes":[],"recorrentes":[],"config":{"categorias":["Serviços"],"contas":["Nubank"]}}'
```

## Integração com o frontend

O frontend deve ter `VITE_CLOUD_API_URL=http://localhost:3001` no `.env` para apontar para o servidor local.
