CREATE INDEX IF NOT EXISTS idx_orders_clerk_user_created_at
ON orders (clerk_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
ON orders (status, created_at DESC);

-- order_code ya tiene indice por la restriccion UNIQUE definida en 0001_create_orders.sql
