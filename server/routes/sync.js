import { Router } from 'express';
import * as syncRepo from '../repos/syncRepo.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const userId = req.user.userId;
  const since = req.query.since || '';
  const store = syncRepo.getSnapshot(userId, since);
  res.json({
    transacoes: store.transacoes,
    recorrentes: store.recorrentes,
    config: store.config
  });
});

router.post('/', (req, res) => {
  const userId = req.user.userId;
  const { transacoes = [], recorrentes = [], config = {} } = req.body;
  syncRepo.saveSnapshot(userId, { transacoes, recorrentes, config });
  res.json({ ok: true });
});

export default router;
