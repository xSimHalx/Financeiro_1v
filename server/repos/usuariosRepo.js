import { getDb } from '../db.js';

export function findByEmail(email) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email?.trim() || '');
  return row || null;
}

export function findById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row || null;
}

export function create({ id, email, nome, passwordHash }) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, email, nome, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email.trim(), nome || '', passwordHash, now);
  return { id, email: email.trim(), nome: nome || email.trim() };
}

export function ensureAdminSeed(emailDefault, passwordHash) {
  const db = getDb();
  const existing = db.prepare('SELECT 1 FROM users LIMIT 1').get();
  if (existing) return;
  const id = 'user-1';
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO users (id, email, nome, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, emailDefault, 'Admin', passwordHash, now);
}
