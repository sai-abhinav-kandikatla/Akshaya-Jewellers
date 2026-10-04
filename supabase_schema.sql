-- ==============================================================================
-- AKSHAYA JEWELLERY — SUPABASE DATABASE SCHEMA & RPC FUNCTIONS
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  coupon_value NUMERIC(10, 2) NOT NULL CHECK (coupon_value > 0),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_date_range CHECK (valid_until >= valid_from)
);

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_phone ON public.coupons(phone_number);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON public.coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_audit_logs_coupon ON public.audit_logs(coupon_id);

-- 6. Row Level Security (RLS) Policies

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies (Authenticated staff only)
CREATE POLICY "Allow authenticated users full access to campaigns"
  ON public.campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Coupons Policies
-- Allow authenticated staff full access
CREATE POLICY "Allow authenticated staff full access to coupons"
  ON public.coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public/anonymous read access for verification by code
CREATE POLICY "Allow anonymous read access to coupons for verification"
  ON public.coupons FOR SELECT TO anon USING (true);

-- Audit Logs Policies
CREATE POLICY "Allow authenticated staff access to audit logs"
  ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. ATOMIC CLAIM COUPON RPC FUNCTION
CREATE OR REPLACE FUNCTION public.claim_coupon(p_coupon_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_today DATE;
BEGIN
  -- Get current date in IST timezone
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- Lock row for update (prevents concurrent claim race condition)
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE coupon_code = p_coupon_code
  FOR UPDATE;

  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  -- Check stored status
  IF v_coupon.status = 'CLAIMED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon has already been claimed');
  END IF;

  IF v_coupon.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon has been cancelled');
  END IF;

  -- Check dates
  IF v_today < v_coupon.valid_from THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon is not active yet');
  END IF;

  IF v_today > v_coupon.valid_until THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon has expired');
  END IF;

  -- Perform atomic claim update
  UPDATE public.coupons
  SET 
    status = 'CLAIMED',
    claimed_at = NOW(),
    claimed_by = auth.uid()
  WHERE id = v_coupon.id;

  -- Log audit event
  INSERT INTO public.audit_logs (user_id, action, coupon_id, campaign_id, details)
  VALUES (
    auth.uid(),
    'COUPON_CLAIMED',
    v_coupon.id,
    v_coupon.campaign_id,
    jsonb_build_object(
      'coupon_code', v_coupon.coupon_code,
      'claimed_at', NOW(),
      'claimed_by', auth.uid()
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Coupon claimed successfully');
END;
$$;

-- 8. ATOMIC CANCEL COUPON RPC FUNCTION
CREATE OR REPLACE FUNCTION public.cancel_coupon(p_coupon_code TEXT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE coupon_code = p_coupon_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  IF v_coupon.status = 'CLAIMED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel a claimed coupon');
  END IF;

  IF v_coupon.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon is already cancelled');
  END IF;

  UPDATE public.coupons
  SET 
    status = 'CANCELLED',
    cancelled_at = NOW(),
    cancelled_by = auth.uid()
  WHERE id = v_coupon.id;

  INSERT INTO public.audit_logs (user_id, action, coupon_id, campaign_id, details)
  VALUES (
    auth.uid(),
    'COUPON_CANCELLED',
    v_coupon.id,
    v_coupon.campaign_id,
    jsonb_build_object(
      'coupon_code', v_coupon.coupon_code,
      'reason', p_reason,
      'cancelled_at', NOW()
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Coupon cancelled successfully');
END;
$$;

-- 9. DASHBOARD STATS RPC FUNCTION
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_campaign_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE;
  v_result JSONB;
BEGIN
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  SELECT jsonb_build_object(
    'total_count', COUNT(*),
    'active_count', COUNT(*) FILTER (WHERE status = 'ACTIVE' AND valid_from <= v_today AND valid_until >= v_today),
    'not_active_count', COUNT(*) FILTER (WHERE status = 'ACTIVE' AND valid_from > v_today),
    'claimed_count', COUNT(*) FILTER (WHERE status = 'CLAIMED'),
    'expired_count', COUNT(*) FILTER (WHERE status = 'ACTIVE' AND valid_until < v_today),
    'cancelled_count', COUNT(*) FILTER (WHERE status = 'CANCELLED'),
    'total_value', COALESCE(SUM(coupon_value), 0),
    'active_value', COALESCE(SUM(coupon_value) FILTER (WHERE status = 'ACTIVE' AND valid_from <= v_today AND valid_until >= v_today), 0),
    'claimed_value', COALESCE(SUM(coupon_value) FILTER (WHERE status = 'CLAIMED'), 0),
    'expired_value', COALESCE(SUM(coupon_value) FILTER (WHERE status = 'ACTIVE' AND valid_until < v_today), 0)
  ) INTO v_result
  FROM public.coupons
  WHERE (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

  RETURN v_result;
END;
$$;
