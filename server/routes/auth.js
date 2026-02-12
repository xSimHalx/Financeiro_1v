import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as usuariosRepo from '../repos/usuariosRepo.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vertexads-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarEmail(email) {
  if (!email || typeof email !== 'string') return { ok: false, error: 'E-mail obrigatório' };
  const trimmed = email.trim();
  if (!trimmed) return { ok: false, error: 'E-mail obrigatório' };
  if (!EMAIL_REGEX.test(trimmed)) return { ok: false, error: 'E-mail inválido' };
  return { ok: true, email: trimmed };
}

function validarSenha(senha) {
  if (!senha || typeof senha !== 'string') return { ok: false, error: 'Senha obrigatória' };
  if (senha.length < 8) return { ok: false, error: 'Senha deve ter no mínimo 8 caracteres' };
  return { ok: true };
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailVal = validarEmail(email);
  if (!emailVal.ok) return res.status(400).json({ error: emailVal.error });
  if (!validarSenha(password).ok) return res.status(400).json({ error: 'Senha obrigatória' });

  const user = usuariosRepo.findByEmail(emailVal.email);
  if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'E-mail ou senha inválidos' });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({
    token,
    user: { id: user.id, email: user.email, nome: user.nome || user.email }
  });
});

router.post('/register', async (req, res) => {
  const { email, password, nome } = req.body || {};
  const emailVal = validarEmail(email);
  if (!emailVal.ok) return res.status(400).json({ error: emailVal.error });

  const senhaVal = validarSenha(password);
  if (!senhaVal.ok) return res.status(400).json({ error: senhaVal.error });

  const existing = usuariosRepo.findByEmail(emailVal.email);
  if (existing) return res.status(400).json({ error: 'E-mail já cadastrado' });

  const id = `user-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  usuariosRepo.create({ id, email: emailVal.email, nome: nome ? String(nome).trim() : '', passwordHash });

  const token = jwt.sign({ userId: id, email: emailVal.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.status(201).json({
    token,
    user: { id, email: emailVal.email, nome: nome ? String(nome).trim() : emailVal.email }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = usuariosRepo.findById(req.user.userId);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  res.json({
    user: { id: user.id, email: user.email, nome: user.nome || user.email }
  });
});

export default router;
