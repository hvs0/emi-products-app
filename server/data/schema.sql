PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  badge TEXT,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  storage TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  finish TEXT NOT NULL,
  mrp INTEGER NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emi_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  tenure_months INTEGER NOT NULL,
  monthly_payment INTEGER NOT NULL,
  interest_rate REAL NOT NULL,
  cashback INTEGER DEFAULT 0,
  partner_fund TEXT NOT NULL,
  is_popular INTEGER DEFAULT 0,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
);
