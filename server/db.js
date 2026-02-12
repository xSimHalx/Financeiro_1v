import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = path.join(__dirname, 'storage');
const DB_PATH = path.join(STORAGE_DIR, 'db.sqlite');

let db = null;

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots(user_id);

    CREATE TABLE IF NOT EXISTS meta (
      user_id TEXT PRIMARY KEY,
      last_synced_at TEXT,
      device_id TEXT,
      schema_version INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

/**
 * Inicializa o banco SQLite e executa migração de JSON se existir.
 */
export function init() {
  ensureStorageDir();
  db = new Database(DB_PATH);
  initSchema();
  migrateFromJsonIfNeeded();
  return db;
}

/**
 * Retorna a instância do banco. Chame init() antes.
 */
export function getDb() {
  if (!db) throw new Error('Banco não inicializado. Chame db.init() antes.');
  return db;
}

/**
 * Migra dados de auth-users.json e sync-store-*.json para SQLite (executa só uma vez).
 */
function migrateFromJsonIfNeeded() {
  const authPath = path.join(__dirname, 'auth-users.json');
  const migratedFlag = path.join(__dirname, '.migrated-to-sqlite');

  if (fs.existsSync(migratedFlag)) return;

  const stmtInsertUser = db.prepare(
    'INSERT OR IGNORE INTO users (id, email, nome, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  );

  const stmtInsertSnapshot = db.prepare(
    'INSERT INTO snapshots (user_id, updated_at, payload_json, created_at) VALUES (?, ?, ?, ?)'
  );

  const stmtInsertMeta = db.prepare(
    'INSERT OR REPLACE INTO meta (user_id, last_synced_at, device_id, schema_version) VALUES (?, ?, NULL, 1)'
  );

  if (fs.existsSync(authPath)) {
    try {
      const raw = fs.readFileSync(authPath, 'utf8');
      const users = JSON.parse(raw);
      const now = new Date().toISOString();
      for (const u of users) {
        stmtInsertUser.run(
          u.id,
          u.email,
          u.nome || u.email || '',
          u.passwordHash || u.password_hash || '',
          now
        );
      }
    } catch (e) {
      console.warn('Migração auth-users.json falhou:', e.message);
    }
  }

  const syncFiles = fs.readdirSync(__dirname).filter((f) => f.startsWith('sync-store-') && f.endsWith('.json'));
  for (const file of syncFiles) {
    const match = file.match(/sync-store-(.+)\.json$/);
    if (!match) continue;
    const userId = match[1];
    try {
      const raw = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const store = JSON.parse(raw);
      const payload = {
        transacoes: store.transacoes || [],
        recorrentes: store.recorrentes || [],
        config: store.config || {}
      };
      const updatedAt = payload.config?.lastSyncedAt || new Date().toISOString();
      stmtInsertSnapshot.run(userId, updatedAt, JSON.stringify(payload), new Date().toISOString());
      stmtInsertMeta.run(userId, payload.config?.lastSyncedAt || null);
    } catch (e) {
      console.warn(`Migração ${file} falhou:`, e.message);
    }
  }

  try {
    fs.writeFileSync(migratedFlag, new Date().toISOString(), 'utf8');
    console.log('Migração JSON -> SQLite concluída.');
  } catch (_) {}
}
