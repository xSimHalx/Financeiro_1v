// #region agent log
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const _agentDir = path.dirname(fileURLToPath(import.meta.url));
const _logPath = path.join(_agentDir, 'debug-agent.log');
const _log = (msg, data) => {
  try {
    const payload = JSON.stringify({ location: 'server.js', message: msg, data: data || {}, timestamp: Date.now(), hypothesisId: data?.h || 'A' }) + '\n';
    fs.appendFileSync(_logPath, payload);
  } catch (e) {}
  try { fetch('http://127.0.0.1:7243/ingest/056378c2-918b-4829-95ff-935ea09984ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js',message:msg,data:data||{},timestamp:Date.now(),hypothesisId:data?.h||'A'})}).catch(()=>{}); } catch(e) {}
};
process.on('uncaughtException', (err) => { _log('uncaughtException', { msg: err?.message, code: err?.code, h: 'E' }); });
process.on('unhandledRejection', (reason) => { _log('unhandledRejection', { msg: String(reason), h: 'E' }); });
// #endregion

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { init as initDb } from './db.js';
import * as usuariosRepo from './repos/usuariosRepo.js';
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';

_log('imports-complete', { cwd: process.cwd(), h: 'B' });

const JWT_SECRET = process.env.JWT_SECRET || 'vertexads-dev-secret-change-in-production';
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT_MAX_AUTH = Number(process.env.RATE_LIMIT_MAX_AUTH) || 20;
const RATE_LIMIT_MAX_SYNC = Number(process.env.RATE_LIMIT_MAX_SYNC) || 200;

if (!process.env.JWT_SECRET) {
  console.warn('AVISO: JWT_SECRET não definido em .env. Usando valor padrão (inseguro para produção).');
  _log('jwt-secret-missing', { h: 'D' });
}

initDb();
_log('initDb-done', { h: 'B' });

const hashAdmin = bcrypt.hashSync('admin123', 10);
usuariosRepo.ensureAdminSeed('admin@vertexads.com', hashAdmin);

const app = express();

const corsOptions = CORS_ORIGIN
  ? { origin: CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean), credentials: true }
  : {};
app.use(cors(corsOptions));
// #region agent log
app.use((req, res, next) => { _log('request-hit', { path: req.path, method: req.method, h: 'A' }); next(); });
// #endregion
app.use(helmet({ contentSecurityPolicy: false }));
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
app.use('/auth', authRoutes);

app.use('/sync', limiterSync);
app.use('/sync', syncRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sync + Auth API em http://localhost:${PORT}`);
});
