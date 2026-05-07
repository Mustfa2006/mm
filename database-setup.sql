-- =============================================
-- نظام إدارة الطلبات - إعداد قاعدة البيانات
-- Iraqi Order Management System - Database Setup
-- =============================================

-- 1. Create traders table
CREATE TABLE IF NOT EXISTS traders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT DEFAULT '',
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT DEFAULT '',
  product TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price TEXT NOT NULL,
  profit NUMERIC DEFAULT 0,
  trader_id UUID REFERENCES traders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_delivery', 'delivered', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trader_id UUID REFERENCES traders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  card_number TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'transferred', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_trader_id ON orders(trader_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traders_username ON traders(username);
CREATE INDEX IF NOT EXISTS idx_withdrawals_trader_id ON withdrawals(trader_id);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;

-- 6. Disable RLS
ALTER TABLE traders DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;

-- =============================================
-- MIGRATION: If you already have the old tables, run this:
--
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS profit NUMERIC DEFAULT 0;
-- ALTER TABLE traders ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
-- CREATE TABLE IF NOT EXISTS withdrawals (...copy from above...);
-- =============================================
