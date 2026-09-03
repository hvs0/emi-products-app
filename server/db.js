import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'catalog.sqlite');
const schemaPath = path.join(dataDir, 'schema.sql');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

export function initializeSchema() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

export function queryAll(sql, params = {}) {
  return db.prepare(sql).all(params);
}

export function queryOne(sql, params = {}) {
  return db.prepare(sql).get(params);
}

export function run(sql, params = {}) {
  return db.prepare(sql).run(params);
}
