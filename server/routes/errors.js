import { Router } from 'express';
import { sendErrorReport, sendTestEmail } from '../lib/email.js';

const router = Router();

/** POST /api/report-error - Recebe erro do frontend e envia por email */
router.post('/report-error', async (req, res) => {
  try {
    const { message, stack, source, userAgent, timestamp } = req.body || {};
    const result = await sendErrorReport({ message, stack, source, userAgent, timestamp });
    if (!result.ok) return res.status(503).json({ error: result.error });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao enviar reporte' });
  }
});

/** GET /api/email/test - Envia email de teste para simhal2016@gmail.com */
router.get('/email/test', async (_req, res) => {
  try {
    const result = await sendTestEmail();
    if (!result.ok) return res.status(503).json({ error: result.error });
    res.json({ ok: true, message: 'Email de teste enviado para simhal2016@gmail.com' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao enviar teste' });
  }
});

export default router;
