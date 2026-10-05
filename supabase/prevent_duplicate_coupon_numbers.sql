-- Run this once in Supabase SQL Editor on an existing deployment.
-- It prevents a mobile number from receiving a second coupon, including concurrent requests.
-- Existing coupon rows remain untouched; the most recent existing coupon is reused by the app.

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
