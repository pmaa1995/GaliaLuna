PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('cart', 'product')),
  customer_mode TEXT NOT NULL CHECK (customer_mode IN ('account', 'guest')),
  clerk_user_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  sector TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  reference_text TEXT,
  delivery_notes TEXT,
  subtotal_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DOP',
  item_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_confirmation',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_clerk_user_id ON orders (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_category TEXT,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DOP',
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
