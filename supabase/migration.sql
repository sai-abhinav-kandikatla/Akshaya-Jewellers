-- ==============================================================================
-- AKSHAYA JEWELLERS — GIFT COUPON MANAGEMENT SYSTEM
-- Complete Database Migration for Supabase PostgreSQL
-- ==============================================================================
-- Run this entire file in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CAMPAIGNS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT valid_campaign_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON public.campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON public.campaigns(end_date);

-- ==============================================================================
-- 3. COUPONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    coupon_value NUMERIC(12, 2) NOT NULL CHECK (coupon_value > 0),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED', 'CANCELLED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at TIMESTAMPTZ,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    whatsapp_status TEXT DEFAULT 'PREPARED' CHECK (whatsapp_status IN ('SENT', 'PREPARED', 'FAILED')),
    excel_sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (excel_sync_status IN ('SYNCED', 'PENDING', 'ERROR')),
    excel_synced_at TIMESTAMPTZ,
    CONSTRAINT valid_coupon_dates CHECK (valid_until >= valid_from),
    CONSTRAINT unique_coupon_code UNIQUE (coupon_code)
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'PREPARED';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS excel_sync_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS excel_synced_at TIMESTAMPTZ;

ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
ALTER TABLE public.coupons
    ADD CONSTRAINT coupons_status_check CHECK (status IN ('ACTIVE', 'CLAIMED', 'CANCELLED', 'EXPIRED'));

UPDATE public.coupons
SET status = 'EXPIRED', excel_sync_status = 'PENDING', excel_synced_at = NULL
WHERE status = 'ACTIVE'
  AND valid_until < (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

UPDATE public.coupons
SET excel_sync_status = 'PENDING', excel_synced_at = NULL
WHERE status IN ('CLAIMED', 'CANCELLED', 'EXPIRED');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_coupons_coupon_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_phone_number ON public.coupons(phone_number);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_from ON public.coupons(valid_from);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign_id ON public.coupons(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons(created_at DESC);

-- Keep one coupon per normalized mobile number, including retries and concurrent submissions.
-- The registry also lets us add this rule safely when historical coupon rows contain duplicates.
CREATE TABLE IF NOT EXISTS public.coupon_phone_registry (
    phone_number TEXT PRIMARY KEY
);

ALTER TABLE public.coupon_phone_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coupon_phone_registry FROM PUBLIC, anon, authenticated;

INSERT INTO public.coupon_phone_registry (phone_number)
SELECT DISTINCT CASE
    WHEN length(normalized_phone) = 12 AND left(normalized_phone, 2) = '91'
        THEN right(normalized_phone, 10)
    ELSE normalized_phone
END
FROM (
    SELECT regexp_replace(phone_number, '[^0-9]', '', 'g') AS normalized_phone
    FROM public.coupons
) AS existing_phones
WHERE normalized_phone <> ''
ON CONFLICT (phone_number) DO NOTHING;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_coupon_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    normalized_phone TEXT;
BEGIN
    normalized_phone := regexp_replace(coalesce(NEW.phone_number, ''), '[^0-9]', '', 'g');
    IF length(normalized_phone) = 12 AND left(normalized_phone, 2) = '91' THEN
        normalized_phone := right(normalized_phone, 10);
    END IF;

    IF normalized_phone = '' THEN
        RAISE EXCEPTION 'Customer mobile number is required';
    END IF;

    NEW.phone_number := normalized_phone;

    INSERT INTO public.coupon_phone_registry (phone_number)
    VALUES (normalized_phone)
    ON CONFLICT (phone_number) DO NOTHING;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'A coupon already exists for this mobile number'
            USING ERRCODE = '23505', CONSTRAINT = 'unique_coupon_phone_number';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_coupon_phone ON public.coupons;
CREATE TRIGGER prevent_duplicate_coupon_phone
    BEFORE INSERT ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_duplicate_coupon_phone();

-- ==============================================================================
-- 4. AUDIT LOG TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'COUPON_CREATED',
        'COUPON_CLAIMED',
        'COUPON_CANCELLED',
        'WHATSAPP_PREPARED',
        'COUPON_VIEWED',
        'CAMPAIGN_CREATED',
        'CAMPAIGN_UPDATED',
        'LOGIN',
        'LOGOUT'
    )),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_coupon_id ON public.audit_logs(coupon_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- CAMPAIGNS: Authenticated users can do everything
CREATE POLICY "Authenticated users can view campaigns"
    ON public.campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
    ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
    ON public.campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- COUPONS: Authenticated users can view, insert, update (no delete!)
CREATE POLICY "Authenticated users can view coupons"
    ON public.coupons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert coupons"
    ON public.coupons FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update coupons"
    ON public.coupons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- COUPONS: Anonymous users can view coupons (for QR verification)
CREATE POLICY "Anyone can view coupons for verification"
    ON public.coupons FOR SELECT TO anon USING (true);

-- AUDIT LOGS: Authenticated users can view and insert
CREATE POLICY "Authenticated users can view audit logs"
    ON public.audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Allow RPC functions (SECURITY DEFINER) to insert audit logs
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT TO anon WITH CHECK (true);

-- ==============================================================================
-- 6. HELPER FUNCTION: Compute display status
-- ==============================================================================
-- This function computes the display status based on stored status and dates.
-- CLAIMED and CANCELLED are terminal states that override date-based computation.
CREATE OR REPLACE FUNCTION public.compute_coupon_status(
    p_status TEXT,
    p_valid_from DATE,
    p_valid_until DATE
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_today DATE;
BEGIN
    -- Terminal states: always return as-is
    IF p_status = 'CLAIMED' THEN RETURN 'CLAIMED'; END IF;
    IF p_status = 'CANCELLED' THEN RETURN 'CANCELLED'; END IF;
    
    -- Compute date-based status using IST
    v_today := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
    
    IF v_today < p_valid_from THEN
        RETURN 'NOT_ACTIVE';
    ELSIF v_today > p_valid_until THEN
        RETURN 'EXPIRED';
    ELSE
        RETURN 'ACTIVE';
    END IF;
END;
$$;

-- ==============================================================================
-- 7. ATOMIC CLAIM COUPON RPC
-- ==============================================================================
-- Uses FOR UPDATE row lock to prevent double-claiming.
-- Only one concurrent claim can succeed; others will get an error.
CREATE OR REPLACE FUNCTION public.claim_coupon(p_coupon_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_now TIMESTAMPTZ;
    v_today DATE;
    v_user_id UUID;
    v_display_status TEXT;
BEGIN
    v_user_id := auth.uid();
    v_now := NOW() AT TIME ZONE 'Asia/Kolkata';
    v_today := v_now::DATE;

    -- Lock the row to prevent concurrent claims
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE coupon_code = p_coupon_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Coupon not found.'
        );
    END IF;

    -- Check terminal states first
    IF v_coupon.status = 'CLAIMED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This coupon has already been claimed.',
            'claimed_at', v_coupon.claimed_at
        );
    END IF;

    IF v_coupon.status = 'CANCELLED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This coupon has been cancelled.'
        );
    END IF;

    -- Check date-based validity
    IF v_today < v_coupon.valid_from THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This coupon is not active yet. Valid from ' || to_char(v_coupon.valid_from, 'DD Month YYYY') || '.'
        );
    END IF;

    IF v_today > v_coupon.valid_until THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This coupon has expired. It was valid until ' || to_char(v_coupon.valid_until, 'DD Month YYYY') || '.'
        );
    END IF;

    -- All checks passed — atomically claim the coupon
    UPDATE public.coupons
    SET 
        status = 'CLAIMED',
        claimed_at = v_now,
        claimed_by = v_user_id
    WHERE id = v_coupon.id;

    -- Insert audit log entry
    INSERT INTO public.audit_logs (user_id, action, coupon_id, details)
    VALUES (
        v_user_id,
        'COUPON_CLAIMED',
        v_coupon.id,
        jsonb_build_object(
            'coupon_code', v_coupon.coupon_code,
            'customer_name', v_coupon.customer_name,
            'coupon_value', v_coupon.coupon_value,
            'claimed_at', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Coupon claimed successfully!',
        'claimed_at', v_now
    );
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.claim_coupon(TEXT) TO authenticated;

-- ==============================================================================
-- 8. ATOMIC CANCEL COUPON RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cancel_coupon(p_coupon_code TEXT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_now TIMESTAMPTZ;
    v_today DATE;
    v_user_id UUID;
    v_display_status TEXT;
BEGIN
    v_user_id := auth.uid();
    v_now := NOW() AT TIME ZONE 'Asia/Kolkata';
    v_today := v_now::DATE;

    -- Lock the row
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE coupon_code = p_coupon_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon not found.');
    END IF;

    -- Cannot cancel already-claimed coupons
    IF v_coupon.status = 'CLAIMED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Cannot cancel a claimed coupon.'
        );
    END IF;

    -- Cannot cancel already-cancelled coupons
    IF v_coupon.status = 'CANCELLED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This coupon is already cancelled.'
        );
    END IF;

    -- Cancel the coupon
    UPDATE public.coupons
    SET 
        status = 'CANCELLED',
        cancelled_at = v_now,
        cancelled_by = v_user_id
    WHERE id = v_coupon.id;

    -- Insert audit log entry
    INSERT INTO public.audit_logs (user_id, action, coupon_id, details)
    VALUES (
        v_user_id,
        'COUPON_CANCELLED',
        v_coupon.id,
        jsonb_build_object(
            'coupon_code', v_coupon.coupon_code,
            'customer_name', v_coupon.customer_name,
            'reason', COALESCE(p_reason, 'No reason provided'),
            'cancelled_at', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Coupon cancelled successfully.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_coupon(TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- 9. DASHBOARD STATS RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_campaign_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today DATE;
    v_total_count BIGINT;
    v_active_count BIGINT;
    v_not_active_count BIGINT;
    v_claimed_count BIGINT;
    v_expired_count BIGINT;
    v_cancelled_count BIGINT;
    v_total_value NUMERIC;
    v_active_value NUMERIC;
    v_claimed_value NUMERIC;
    v_expired_value NUMERIC;
BEGIN
    v_today := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

    -- Total count
    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_total_count, v_total_value
    FROM public.coupons
    WHERE (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    -- Active: not terminal, within date range
    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_active_count, v_active_value
    FROM public.coupons
    WHERE status = 'ACTIVE'
      AND v_today >= valid_from
      AND v_today <= valid_until
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    -- Not Active: not terminal, before valid_from
    SELECT COUNT(*)
    INTO v_not_active_count
    FROM public.coupons
    WHERE status = 'ACTIVE'
      AND v_today < valid_from
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    -- Claimed
    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_claimed_count, v_claimed_value
    FROM public.coupons
    WHERE status = 'CLAIMED'
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    -- Expired: not terminal, past valid_until
    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_expired_count, v_expired_value
    FROM public.coupons
    WHERE (status = 'EXPIRED' OR (status = 'ACTIVE' AND v_today > valid_until))
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    -- Cancelled
    SELECT COUNT(*)
    INTO v_cancelled_count
    FROM public.coupons
    WHERE status = 'CANCELLED'
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    RETURN jsonb_build_object(
        'total_count', v_total_count,
        'active_count', v_active_count,
        'not_active_count', v_not_active_count,
        'claimed_count', v_claimed_count,
        'expired_count', v_expired_count,
        'cancelled_count', v_cancelled_count,
        'total_value', v_total_value,
        'active_value', v_active_value,
        'claimed_value', v_claimed_value,
        'expired_value', v_expired_value
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(UUID) TO authenticated;

-- ==============================================================================
-- 10. UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- After running this migration:
-- 1. Go to Authentication → Settings and configure email auth
-- 2. Create your admin user via the signup page
-- 3. (Optional) Disable signup after creating admin
-- ==============================================================================
