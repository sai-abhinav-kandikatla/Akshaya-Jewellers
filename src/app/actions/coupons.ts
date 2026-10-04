'use server'

import { createClient } from '@/lib/supabase/server';
import { ApiResponse, Coupon, CouponWithDisplayStatus, CreateCouponInput, CouponFilters } from '@/lib/types';
import { generateCouponCode } from '@/lib/utils/couponCode';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { normalizePhone } from '@/lib/utils/validators';
import { logAuditEvent } from './audit';

export async function createCoupon(input: CreateCouponInput): Promise<ApiResponse<Coupon>> {
  try {
    const supabase = await createClient();
    
    const val = input.coupon_value || input.discount_value || 0;
    if (!input.customer_name || !input.phone_number || !val || !input.valid_from || !input.valid_until) {
      return { success: false, error: 'Customer name, phone, value, valid from, and valid until dates are required.' };
    }

    const phone = normalizePhone(input.phone_number);
    let code = '';
    let retryCount = 0;
    let coupon = null;

    while (retryCount < 5) {
      code = generateCouponCode();
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          coupon_code: code,
          customer_name: input.customer_name,
          phone_number: phone,
          coupon_value: val,
          campaign_id: input.campaign_id || null,
          valid_from: input.valid_from,
          valid_until: input.valid_until,
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (!error && data) {
        coupon = data;
        break;
      }
      
      if (error && error.code === '23505') {
        retryCount++;
      } else {
        console.error('Error creating coupon:', error);
        return { success: false, error: 'Failed to create coupon due to database error.' };
      }
    }

    if (!coupon) {
      return { success: false, error: 'Failed to generate a unique coupon code after multiple attempts.' };
    }

    await logAuditEvent('COUPON_CREATED', coupon.id, input.campaign_id || undefined, {
      customer_name: coupon.customer_name,
      phone_number: coupon.phone_number,
      code: coupon.coupon_code
    });

    return { success: true, message: 'Coupon created successfully', data: coupon };
  } catch (error) {
    console.error('createCoupon exception:', error);
    return { success: false, error: 'An unexpected error occurred while creating the coupon.' };
  }
}

export async function getCoupons(filters: CouponFilters): Promise<{ coupons: CouponWithDisplayStatus[], total: number }> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const istStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    let query = supabase.from('coupons').select('*, campaigns(name)', { count: 'exact' });

    if (filters.search) {
      query = query.or(`coupon_code.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
    }

    if (filters.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'CLAIMED') {
        query = query.eq('status', 'CLAIMED');
      } else if (filters.status === 'CANCELLED') {
        query = query.eq('status', 'CANCELLED');
      } else if (filters.status === 'ACTIVE') {
        query = query.eq('status', 'ACTIVE').lte('valid_from', istStr).gte('valid_until', istStr);
      } else if (filters.status === 'NOT_ACTIVE') {
        query = query.eq('status', 'ACTIVE').gt('valid_from', istStr);
      } else if (filters.status === 'EXPIRED') {
        query = query.eq('status', 'ACTIVE').lt('valid_until', istStr);
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('getCoupons db error:', error);
      throw new Error('Database error fetching coupons');
    }

    const couponsWithStatus: CouponWithDisplayStatus[] = (data || []).map((c: any) => ({
      ...c,
      campaign_name: c.campaigns?.name,
      display_status: computeDisplayStatus(c.status, c.valid_from, c.valid_until)
    }));

    return { coupons: couponsWithStatus, total: count || 0 };
  } catch (error) {
    console.error('getCoupons exception:', error);
    return { coupons: [], total: 0 };
  }
}

export async function getCouponByCode(code: string): Promise<CouponWithDisplayStatus | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*, campaigns(name)')
      .eq('coupon_code', code)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      campaign_name: data.campaigns?.name,
      display_status: computeDisplayStatus(data.status, data.valid_from, data.valid_until)
    };
  } catch (error) {
    console.error('getCouponByCode exception:', error);
    return null;
  }
}

export async function claimCoupon(couponCode: string): Promise<ApiResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('claim_coupon', { p_coupon_code: couponCode });

    if (error) {
      console.error('claimCoupon rpc error:', error);
      return { success: false, error: error.message || 'Failed to claim coupon.' };
    }

    return { success: true, message: 'Coupon claimed successfully.' };
  } catch (error) {
    console.error('claimCoupon exception:', error);
    return { success: false, error: 'An unexpected error occurred while claiming the coupon.' };
  }
}

export async function cancelCoupon(couponCode: string, reason?: string): Promise<ApiResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('cancel_coupon', { p_coupon_code: couponCode, p_reason: reason });

    if (error) {
      console.error('cancelCoupon rpc error:', error);
      return { success: false, error: error.message || 'Failed to cancel coupon.' };
    }

    return { success: true, message: 'Coupon cancelled successfully.' };
  } catch (error) {
    console.error('cancelCoupon exception:', error);
    return { success: false, error: 'An unexpected error occurred while cancelling the coupon.' };
  }
}

export async function getCouponForVerification(code: string): Promise<CouponWithDisplayStatus | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*, campaigns(name)')
      .eq('coupon_code', code)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      campaign_name: data.campaigns?.name,
      display_status: computeDisplayStatus(data.status, data.valid_from, data.valid_until)
    };
  } catch (error) {
    console.error('getCouponForVerification exception:', error);
    return null;
  }
}
