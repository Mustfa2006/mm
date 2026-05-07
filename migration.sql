-- =============================================
-- Migration: Add profit, balance, and withdrawals
-- Run this in Supabase SQL Editor
-- =============================================

-- Add profit column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS profit NUMERIC DEFAULT 0;

-- Add balance column to traders
ALTER TABLE traders ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trader_id UUID REFERENCES traders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  card_number TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'transferred', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_withdrawals_trader_id ON withdrawals(trader_id);

-- Enable Realtime for withdrawals
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;

-- Disable RLS for withdrawals
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;

-- Update status constraint (remove 'preparing')
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'in_delivery', 'delivered', 'rejected'));
