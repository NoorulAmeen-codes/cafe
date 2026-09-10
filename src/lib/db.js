import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let db;

function init() {
  const database = new Database(path.join(DATA_DIR, 'app.db'));
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'cake',
      sort INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      mrp REAL,
      unit TEXT DEFAULT '1 piece',
      image TEXT DEFAULT '',
      veg INTEGER DEFAULT 1,
      eggless INTEGER DEFAULT 0,
      bestseller INTEGER DEFAULT 0,
      customizable INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      low_stock_at INTEGER DEFAULT 5,
      track_stock INTEGER DEFAULT 1,
      rating REAL DEFAULT 4.8,
      rating_count INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      sort INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carousels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eyebrow TEXT DEFAULT '',
      title TEXT DEFAULT '',
      title_accent TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      cta_label TEXT DEFAULT 'Order Now',
      cta_href TEXT DEFAULT '/menu',
      image TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      pincode TEXT DEFAULT '',
      state TEXT DEFAULT 'Kerala',
      district TEXT DEFAULT 'Palakkad',
      city TEXT DEFAULT '',
      locality TEXT DEFAULT '',
      address_line TEXT DEFAULT '',
      lat REAL,
      lng REAL,
      distance_km REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      kind TEXT DEFAULT 'catalog',
      fulfilment TEXT DEFAULT 'pickup',
      status TEXT DEFAULT 'placed',
      items TEXT DEFAULT '[]',
      customization TEXT DEFAULT '',
      reference_image TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      subtotal REAL DEFAULT 0,
      delivery_charge REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT DEFAULT 'pending',
      payment_ref TEXT DEFAULT '',
      address TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      distance_km REAL,
      slot TEXT DEFAULT '',
      cancel_reason TEXT DEFAULT '',
      review_prompted INTEGER DEFAULT 0,
      reviewed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT DEFAULT '',
      actor TEXT DEFAULT 'system',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      text TEXT DEFAULT '',
      source TEXT DEFAULT 'google',
      posted_on TEXT DEFAULT '',
      order_id INTEGER,
      user_id INTEGER,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT DEFAULT 'error',
      source TEXT DEFAULT 'client',
      message TEXT NOT NULL,
      detail TEXT DEFAULT '',
      url TEXT DEFAULT '',
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      balance INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

const productColumns = database.prepare('PRAGMA table_info(products)').all();

if (!productColumns.some((column) => column.name === 'updated_at')) {
  database.exec(`
    ALTER TABLE products
    ADD COLUMN updated_at TEXT
  `);

  database.exec(`
    UPDATE products
    SET updated_at = CURRENT_TIMESTAMP
    WHERE updated_at IS NULL
  `);
}

return database;
}

export function getDb() {
  if (!db) {
    db = init();
    // seeding is done lazily on first access
    const { seed } = require('./seed.js');
    seed(db);
  }
  return db;
}

export function getSetting(key, fallback = null) {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export function setSetting(key, value) {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, JSON.stringify(value));
}

export function allSettings() {
  const rows = getDb().prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}

export function logEvent({ level = 'error', source = 'server', message, detail = '', url = '' }) {
  try {
    getDb()
      .prepare('INSERT INTO logs (level, source, message, detail, url) VALUES (?,?,?,?,?)')
      .run(level, source, String(message).slice(0, 500), String(detail).slice(0, 4000), url);
  } catch {
    /* never throw from the logger */
  }
}
