import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { init as initDb } from './db.js';
import * as usuariosRepo from './repos/usuariosRepo.js';
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import errorsRoutes from './routes/errors.js';
import authMiddleware from './middlewares/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vertexads-dev-secret-change-in-production';
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT_MAX_AUTH = Number(process.env.RATE_LIMIT_MAX_AUTH) || 20;
const RATE_LIMIT_MAX_SYNC = Number(process.env.RATE_LIMIT_MAX_SYNC) || 200;

if (!process.env.JWT_SECRET) {
  console.warn('AVISO: JWT_SECRET não definido em .env. Usando valor padrão (inseguro para produção).');
}

initDb();

const hashAdmin = bcrypt.hashSync('admin123', 10);
usuariosRepo.ensureAdminSeed('admin@vertexads.com', hashAdmin);

const app = express();

// Necessário atrás de proxy (Cloudflare Tunnel, nginx, etc.) para X-Forwarded-For
app.set('trust proxy', 1);

const defaultOrigins = [
  'https://gestorfinanceirosimhal.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];
const corsOrigins = CORS_ORIGIN
  ? [...new Set([...CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean), ...defaultOrigins])]
  : defaultOrigins;
const corsOptions = { origin: corsOrigins, credentials: true };
app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));

function safeRateLimit(options) {
  const limiter = rateLimit(options);
  return (req, res, next) => {
    try {
      limiter(req, res, (err) => {
        if (err) {
          console.warn('[rate-limit] Erro (requisição prossegue):', err?.message || err);
          return next();
        }
        next();
      });
    } catch (e) {
      console.warn('[rate-limit] Erro (requisição prossegue):', e?.message || e);
      next();
    }
  };
}

const limiterAuth = safeRateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_AUTH,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

const limiterSync = safeRateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_SYNC,
  message: { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/auth/login', limiterAuth);
app.use('/auth/register', limiterAuth);
app.use('/auth', authRoutes);

app.use('/sync', limiterSync);
app.use('/sync', authMiddleware, syncRoutes);

app.use('/api', errorsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sync + Auth API em http://localhost:${PORT}`);
});
