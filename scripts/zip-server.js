import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');
const OUTPUT = path.join(ROOT, 'public', 'vertexads-server.zip');

const EXCLUDE = ['node_modules', 'storage', '.env', '.migrated-to-sqlite', 'auth-users.json', 'package-lock.json'];
const EXCLUDE_PATTERN = /^(sync-store-.*\.json)$/;

function shouldExclude(name) {
  if (EXCLUDE.includes(name)) return true;
  if (EXCLUDE_PATTERN.test(name)) return true;
  return false;
}

function addDir(archive, dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    const zipPath = path.join(prefix, e.name).replace(/\\/g, '/');
    if (shouldExclude(e.name)) continue;
    if (e.isDirectory()) {
      addDir(archive, fullPath, zipPath);
    } else {
      archive.file(fullPath, { name: path.join('vertexads-server', zipPath).replace(/\\/g, '/') });
    }
  }
}

const out = fs.createWriteStream(OUTPUT);
const archive = archiver('zip', { z: { level: 6 } });

out.on('close', () => {
  console.log(`Servidor empacotado: ${OUTPUT} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(out);
addDir(archive, SERVER_DIR);
archive.finalize();
