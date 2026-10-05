-- Apply once to an existing deployment. Vercel does not execute Supabase SQL
-- migrations as part of an application deployment.

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS excel_sync_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS excel_synced_at TIMESTAMPTZ;

ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
ALTER TABLE public.coupons
    ADD CONSTRAINT coupons_status_check CHECK (status IN ('ACTIVE', 'CLAIMED', 'CANCELLED', 'EXPIRED'));

-- Persist coupons that have already passed their last valid IST date, and queue
-- all terminal rows for one Excel reconciliation after this upgrade.
UPDATE public.coupons
SET status = 'EXPIRED', excel_sync_status = 'PENDING', excel_synced_at = NULL
WHERE status = 'ACTIVE'
  AND valid_until < (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

UPDATE public.coupons
SET excel_sync_status = 'PENDING', excel_synced_at = NULL
WHERE status IN ('CLAIMED', 'CANCELLED', 'EXPIRED');

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

    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_total_count, v_total_value
    FROM public.coupons
    WHERE (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_active_count, v_active_value
    FROM public.coupons
    WHERE status = 'ACTIVE'
      AND v_today >= valid_from
      AND v_today <= valid_until
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    SELECT COUNT(*)
    INTO v_not_active_count
    FROM public.coupons
    WHERE status = 'ACTIVE'
      AND v_today < valid_from
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_claimed_count, v_claimed_value
    FROM public.coupons
    WHERE status = 'CLAIMED'
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

    SELECT COUNT(*), COALESCE(SUM(coupon_value), 0)
    INTO v_expired_count, v_expired_value
    FROM public.coupons
    WHERE (status = 'EXPIRED' OR (status = 'ACTIVE' AND v_today > valid_until))
      AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);

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
