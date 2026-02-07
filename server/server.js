import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_USERS_PATH = path.join(__dirname, 'auth-users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'vertexads-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

const CORS_ORIGIN = process.env.CORS_ORIGIN; // ex.: https://app.vertexads.com ou http://localhost:5173 (vírgulas para vários)
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX_AUTH = Number(process.env.RATE_LIMIT_MAX_AUTH) || 20; // requisições por janela em /auth/login e /auth/register
const RATE_LIMIT_MAX_SYNC = Number(process.env.RATE_LIMIT_MAX_SYNC) || 200; // requisições por janela em /sync

const emptyStore = () => ({
  transacoes: [],
  recorrentes: [],
  config: {
    categorias: [],
    contas: [],
    contasInvestimento: [],
    clientes: [],
    statusLancamento: [{ id: 'pago', label: 'Pago' }, { id: 'previsto', label: 'Previsto' }],
    lastSyncedAt: null
  }
});

function getStorePath(userId) {
  return path.join(__dirname, `sync-store-${userId}.json`);
}

function readStore(userId) {
  const storePath = getStorePath(userId);
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return emptyStore();
  }
}

function writeStore(userId, data) {
  fs.writeFileSync(getStorePath(userId), JSON.stringify(data, null, 2), 'utf8');
}

function readAuthUsers() {
  try {
    const raw = fs.readFileSync(AUTH_USERS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeAuthUsers(users) {
  fs.writeFileSync(AUTH_USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

function ensureAuthSeed() {
  let users = readAuthUsers();
  if (users.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    users = [{ id: 'user-1', email: 'admin@vertexads.com', passwordHash: hash, nome: 'Admin' }];
    writeAuthUsers(users);
  }
  return users;
}

function mergeByUpdatedAt(existing, incoming) {
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) {
    const cur = byId.get(t.id);
    if (!cur || (t.updatedAt && cur.updatedAt && t.updatedAt > cur.updatedAt)) byId.set(t.id, t);
  }
  return Array.from(byId.values());
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

const app = express();

const corsOptions = CORS_ORIGIN
  ? { origin: CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean), credentials: true }
  : {}; // dev: permite qualquer origem
app.use(cors(corsOptions));

app.use(helmet({ contentSecurityPolicy: false })); // desativa CSP para não quebrar scripts; pode ativar em produção
app.use(express.json({ limit: '2mb' }));

const limiterAuth = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_AUTH,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

const limiterSync = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_SYNC,
  message: { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/auth/login', limiterAuth);
app.use('/auth/register', limiterAuth);
app.use('/sync', limiterSync);

ensureAuthSeed();

app.get('/sync', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const since = req.query.since || '';
  const store = readStore(userId);
  let transacoes = store.transacoes || [];
  let recorrentes = store.recorrentes || [];
  if (since) {
    transacoes = transacoes.filter((t) => t.updatedAt && t.updatedAt >= since);
    recorrentes = recorrentes.filter((r) => r.updatedAt && r.updatedAt >= since);
  }
  res.json({
    transacoes,
    recorrentes,
    config: store.config || {}
  });
});

app.post('/sync', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { transacoes = [], recorrentes = [], config = {} } = req.body;
  const store = readStore(userId);
  const existingTx = store.transacoes || [];
  const existingRec = store.recorrentes || [];
  store.transacoes = mergeByUpdatedAt(existingTx, transacoes);
  store.recorrentes = mergeByUpdatedAt(existingRec, recorrentes);
  if (config.categorias?.length) store.config = { ...store.config, categorias: config.categorias };
  if (config.contas?.length) store.config = { ...store.config, contas: config.contas };
  if (Array.isArray(config.contasInvestimento)) store.config = { ...store.config, contasInvestimento: config.contasInvestimento };
  if (Array.isArray(config.clientes)) store.config = { ...store.config, clientes: config.clientes };
  if (Array.isArray(config.statusLancamento) && config.statusLancamento.length > 0) store.config = { ...store.config, statusLancamento: config.statusLancamento };
  writeStore(userId, store);
  res.json({ ok: true });
});

function validarSenha(senha) {
  if (!senha || typeof senha !== 'string') return { ok: false, error: 'Senha obrigatória' };
  if (senha.length < 8) return { ok: false, error: 'Senha deve ter no mínimo 8 caracteres' };
  return { ok: true };
}

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailTrim = email != null ? String(email).trim() : '';
  if (!emailTrim || !password) {
    return res.status(400).json({ error: 'E-mail e senha obrigatórios' });
  }
  const users = readAuthUsers();
  const user = users.find((u) => u.email.toLowerCase() === emailTrim.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.json({
    token,
    user: { id: user.id, email: user.email, nome: user.nome || user.email }
  });
});

app.post('/auth/register', async (req, res) => {
  const { email, password, nome } = req.body || {};
  const emailTrim = email != null ? String(email).trim() : '';
  if (!emailTrim) {
    return res.status(400).json({ error: 'E-mail obrigatório' });
  }
  const senhaValidacao = validarSenha(password);
  if (!senhaValidacao.ok) {
    return res.status(400).json({ error: senhaValidacao.error });
  }
  const users = readAuthUsers();
  const existing = users.find((u) => u.email.toLowerCase() === emailTrim.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'E-mail já cadastrado' });
  }
  const id = `user-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = { id, email: emailTrim, passwordHash, nome: nome ? String(nome).trim() : '' };
  users.push(newUser);
  writeAuthUsers(users);
  const token = jwt.sign(
    { userId: id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, nome: newUser.nome || newUser.email }
  });
});

app.get('/auth/me', authMiddleware, (req, res) => {
  const users = readAuthUsers();
  const user = users.find((u) => u.id === req.user.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }
  res.json({
    user: { id: user.id, email: user.email, nome: user.nome || user.email }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sync + Auth API at http://localhost:${PORT}`);
});
