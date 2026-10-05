'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Coupon, CouponWithDisplayStatus, CreateCouponInput, CouponFilters } from '@/lib/types';
import { generateCouponCode } from '@/lib/utils/couponCode';
import { computeDisplayStatus, getISTDateString } from '@/lib/utils/statusCompute';
import { isUuid } from '@/lib/utils/identifiers';
import { isValidIndianMobile, normalizePhone } from '@/lib/utils/validators';
import { logAuditEvent } from './audit';
import { sendWhatsAppCloudAPI } from './whatsapp';
import { syncCouponToExcel } from './excel';

export async function createCoupon(input: CreateCouponInput): Promise<ApiResponse<Coupon>> {
  try {
    const supabase = createAdminClient();
    
    const val = input.coupon_value || input.discount_value || 0;
    if (!input.customer_name || !input.phone_number || !val || !input.valid_from || !input.valid_until) {
      return { success: false, error: 'Customer name, phone, value, valid from, and valid until dates are required.' };
    }

    const phone = normalizePhone(input.phone_number);
    if (!isValidIndianMobile(phone)) {
      return { success: false, error: 'Enter a valid Indian mobile number.' };
    }

    const findExistingCouponForPhone = () => supabase
      .from('coupons')
      .select('*')
      .ilike('phone_number', `%${phone}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: existingCoupon, error: existingCouponError } = await findExistingCouponForPhone();
    if (existingCouponError) {
      return { success: false, error: `Database Error: ${existingCouponError.message}` };
    }
    if (existingCoupon) {
      return {
        success: true,
        message: 'This mobile number already has a coupon. The existing coupon was opened.',
        data: existingCoupon,
      };
    }

    let code = '';
    let retryCount = 0;
    let coupon = null;
    let lastError: any = null;

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
      
      lastError = error;
      if (error && error.code === '23505') {
        if (error.message?.includes('already exists for this mobile number')) {
          const { data: concurrentlyCreatedCoupon } = await findExistingCouponForPhone();
          if (concurrentlyCreatedCoupon) {
            return {
              success: true,
              message: 'This mobile number already has a coupon. The existing coupon was opened.',
              data: concurrentlyCreatedCoupon,
            };
          }
          return { success: false, error: 'A coupon already exists for this mobile number.' };
        }
        retryCount++;
      } else {
        console.error('Error creating coupon:', error);
        let msg = error?.message || 'Failed to create coupon due to database error.';
        if (error?.code === '42P01' || msg.includes('does not exist')) {
          msg = 'Database tables not initialized in Supabase! Please run the provided SQL script in your Supabase SQL Editor.';
        } else if (error?.code === '42501' || msg.includes('row-level security')) {
          msg = 'Row-level security policy error. Please run the updated SQL script in your Supabase SQL Editor.';
        }
        return { 
          success: false, 
          error: `Database Error: ${msg}` 
        };
      }
    }

    if (!coupon) {
      return { 
        success: false, 
        error: lastError?.message 
          ? `Database Error: ${lastError.message}` 
          : 'Failed to generate a unique coupon code after multiple attempts.' 
      };
    }

    // Trigger WhatsApp Cloud API sending
    try {
      await sendWhatsAppCloudAPI(coupon);
    } catch (waErr) {
      console.warn('Non-fatal WhatsApp trigger warning:', waErr);
    }

    // Trigger Excel Cloud Synchronization
    try {
      await syncCouponToExcel(coupon);
    } catch (excelErr) {
      console.warn('Non-fatal Excel sync trigger warning:', excelErr);
    }

    // Log Audit Record
    try {
      await logAuditEvent('COUPON_CREATED', coupon.id, input.campaign_id || undefined, {
        customer_name: coupon.customer_name,
        phone_number: coupon.phone_number,
        code: coupon.coupon_code
      });
    } catch (auditErr) {
      console.warn('Non-fatal audit log failure:', auditErr);
    }

    return { success: true, message: 'Coupon created successfully', data: coupon };
  } catch (error: any) {
    console.error('createCoupon exception:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred while creating the coupon.' };
  }
}

export async function getCoupons(filters: CouponFilters): Promise<{ coupons: CouponWithDisplayStatus[], total: number }> {
  try {
    const supabase = createAdminClient();
    const istStr = getISTDateString();

    let query = supabase.from('coupons').select('*', { count: 'exact' });

    if (filters.search) {
      query = query.or(`coupon_code.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
    }

    const campaignId = filters.campaign_id || filters.campaignId;
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (filters.date_from) {
      query = query.gte('valid_from', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('valid_until', filters.date_to);
    }

    if (filters.value_min !== undefined && Number.isFinite(filters.value_min)) {
      query = query.gte('coupon_value', filters.value_min);
    }
    if (filters.value_max !== undefined && Number.isFinite(filters.value_max)) {
      query = query.lte('coupon_value', filters.value_max);
    }
    if (filters.customer) {
      query = query.ilike('customer_name', `%${filters.customer}%`);
    }
    if (filters.phone) {
      query = query.ilike('phone_number', `%${filters.phone}%`);
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
        query = query.or(`status.eq.EXPIRED,and(status.eq.ACTIVE,valid_until.lt.${istStr})`);
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
      return { coupons: [], total: 0 };
    }

    const couponsWithStatus: CouponWithDisplayStatus[] = (data || []).map((c: any) => {
      const val = Number(c.coupon_value ?? c.value ?? 0);
      return {
        ...c,
        value: val,
        coupon_value: val,
        display_status: computeDisplayStatus(c.status, c.valid_from, c.valid_until)
      };
    });

    return { coupons: couponsWithStatus, total: count || 0 };
  } catch (error) {
    console.error('getCoupons exception:', error);
    return { coupons: [], total: 0 };
  }
}

export async function getCouponByCode(code: string): Promise<CouponWithDisplayStatus | null> {
  try {
    const supabase = createAdminClient();
    const query = supabase
      .from('coupons')
      .select('*');
    const identifier = code.trim();
    const { data, error } = isUuid(identifier)
      ? await query.eq('id', identifier).maybeSingle()
      : await query.eq('coupon_code', identifier.toUpperCase()).maybeSingle();

    if (error) {
      console.error('getCouponByCode database error:', error);
      throw new Error('Unable to load this coupon from the database. Check the Supabase configuration and try again.');
    }
    if (!data) {
      return null;
    }

    const val = Number(data.coupon_value ?? data.value ?? 0);
    return {
      ...data,
      value: val,
      coupon_value: val,
      display_status: computeDisplayStatus(data.status, data.valid_from, data.valid_until)
    };
  } catch (error) {
    console.error('getCouponByCode exception:', error);
    throw error instanceof Error
      ? error
      : new Error('Unable to load this coupon. Please try again.');
  }
}

async function syncChangedCouponStatus(couponId: string, status: 'CLAIMED' | 'CANCELLED') {
  try {
    const supabase = createAdminClient();
    const { data: coupon, error } = await supabase
      .from('coupons')
      .update({ excel_sync_status: 'PENDING', excel_synced_at: null })
      .eq('id', couponId)
      .eq('status', status)
      .select('*')
      .maybeSingle();

    if (error || !coupon) {
      console.error('Failed to load changed coupon for Excel sync:', error);
      return 'Excel update is pending and will retry automatically. Sync Now in Settings can retry sooner.';
    }

    const result = await syncCouponToExcel(coupon);
    return result.success ? null : 'Excel update is pending and will retry automatically. Sync Now in Settings can retry sooner.';
  } catch (error) {
    console.error('Failed to sync changed coupon status to Excel:', error);
    return 'Excel update is pending and will retry automatically. Sync Now in Settings can retry sooner.';
  }
}

function mutationFallbackUnavailable(error: { code?: string; message?: string }) {
  return error.code !== 'PGRST202' && error.code !== '42883';
}

export async function claimCoupon(identifier: string): Promise<ApiResponse> {
  try {
    const supabase = createAdminClient();
    
    // Query the UUID ID column only for UUID-shaped identifiers. Mixing it
    // into an OR filter with a coupon code makes Postgres cast AKS-… to UUID.
    const query = supabase
      .from('coupons')
      .select('*');
    const search = identifier.trim();
    const { data: coupon, error: findError } = isUuid(search)
      ? await query.eq('id', search).maybeSingle()
      : await query.eq('coupon_code', search.toUpperCase()).maybeSingle();

    if (findError) {
      console.error('claimCoupon find error:', findError);
      return { success: false, error: 'Unable to load this coupon from the database. Check the Supabase configuration and try again.' };
    }
    if (!coupon) {
      return { success: false, error: 'Coupon not found.' };
    }

    const currentDisplayStatus = computeDisplayStatus(coupon.status, coupon.valid_from, coupon.valid_until);

    if (currentDisplayStatus === 'CLAIMED' || coupon.status === 'CLAIMED') {
      return { success: false, error: 'This coupon has already been redeemed and cannot be used again.' };
    }

    if (currentDisplayStatus === 'EXPIRED') {
      return { success: false, error: 'This coupon has expired and cannot be redeemed.' };
    }

    if (currentDisplayStatus === 'NOT_ACTIVE') {
      return { success: false, error: 'This coupon is not active yet and cannot be redeemed.' };
    }

    if (currentDisplayStatus === 'CANCELLED') {
      return { success: false, error: 'This coupon has been cancelled and cannot be redeemed.' };
    }

    // Try RPC claim_coupon first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('claim_coupon', { p_coupon_code: coupon.coupon_code });
    if (!rpcError) {
      if (rpcResult?.success === false) {
        return { success: false, error: rpcResult.message || 'This coupon could not be redeemed.' };
      }
      const syncWarning = await syncChangedCouponStatus(coupon.id, 'CLAIMED');
      return {
        success: true,
        message: syncWarning ? `Coupon redeemed successfully. ${syncWarning}` : 'Coupon redeemed successfully and Excel was updated.',
      };
    }

    if (mutationFallbackUnavailable(rpcError)) {
      console.error('claimCoupon RPC error:', rpcError);
      return { success: false, error: 'Could not redeem this coupon. Please try again.' };
    }

    // Direct table update fallback
    const today = getISTDateString();
    const { data: updated, error: updateError } = await supabase
      .from('coupons')
      .update({ status: 'CLAIMED', claimed_at: new Date().toISOString(), excel_sync_status: 'PENDING', excel_synced_at: null })
      .eq('id', coupon.id)
      .eq('status', 'ACTIVE')
      .lte('valid_from', today)
      .gte('valid_until', today)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'This coupon is no longer active and cannot be redeemed.' };
    }

    const syncResult = await syncCouponToExcel(updated);
    return {
      success: true,
      message: syncResult.success ? 'Coupon redeemed successfully and Excel was updated.' : 'Coupon redeemed successfully. Excel update is pending and will retry automatically.',
    };
  } catch (error: any) {
    console.error('claimCoupon exception:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred while claiming the coupon.' };
  }
}

export async function cancelCoupon(identifier: string, reason?: string): Promise<ApiResponse> {
  try {
    const supabase = createAdminClient();
    
    const query = supabase
      .from('coupons')
      .select('*');
    const search = identifier.trim();
    const { data: coupon, error: findError } = isUuid(search)
      ? await query.eq('id', search).maybeSingle()
      : await query.eq('coupon_code', search.toUpperCase()).maybeSingle();

    if (findError) {
      console.error('cancelCoupon find error:', findError);
      return { success: false, error: 'Unable to load this coupon from the database. Check the Supabase configuration and try again.' };
    }
    if (!coupon) {
      return { success: false, error: 'Coupon not found.' };
    }

    if (coupon.status === 'CLAIMED') {
      return { success: false, error: 'Cannot cancel a claimed/redeemed coupon.' };
    }

    if (computeDisplayStatus(coupon.status, coupon.valid_from, coupon.valid_until) === 'EXPIRED') {
      return { success: false, error: 'This coupon has expired and cannot be cancelled.' };
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('cancel_coupon', { p_coupon_code: coupon.coupon_code, p_reason: reason });
    if (!rpcError) {
      if (rpcResult?.success === false) {
        return { success: false, error: rpcResult.message || 'This coupon could not be cancelled.' };
      }
      const syncWarning = await syncChangedCouponStatus(coupon.id, 'CANCELLED');
      return {
        success: true,
        message: syncWarning ? `Coupon cancelled. ${syncWarning}` : 'Coupon cancelled and Excel was updated.',
      };
    }

    if (mutationFallbackUnavailable(rpcError)) {
      console.error('cancelCoupon RPC error:', rpcError);
      return { success: false, error: 'Could not cancel this coupon. Please try again.' };
    }

    const today = getISTDateString();
    const { data: updated, error: updateError } = await supabase
      .from('coupons')
      .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString(), excel_sync_status: 'PENDING', excel_synced_at: null })
      .eq('id', coupon.id)
      .eq('status', 'ACTIVE')
      .gte('valid_until', today)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || rpcError?.message || 'Failed to cancel coupon.' };
    }

    const syncResult = await syncCouponToExcel(updated);
    return {
      success: true,
      message: syncResult.success ? 'Coupon cancelled and Excel was updated.' : 'Coupon cancelled. Excel update is pending and will retry automatically.',
    };
  } catch (error: any) {
    console.error('cancelCoupon exception:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred while cancelling the coupon.' };
  }
}

export async function getCouponForVerification(code: string): Promise<CouponWithDisplayStatus | null> {
  try {
    const supabase = createAdminClient();
    const query = supabase
      .from('coupons')
      .select('*');
    const identifier = code.trim();
    const { data, error } = isUuid(identifier)
      ? await query.eq('id', identifier).maybeSingle()
      : await query.eq('coupon_code', identifier.toUpperCase()).maybeSingle();

    if (error || !data) {
      return null;
    }

    const val = Number(data.coupon_value ?? data.value ?? 0);
    return {
      ...data,
      value: val,
      coupon_value: val,
      display_status: computeDisplayStatus(data.status, data.valid_from, data.valid_until)
    };
  } catch (error) {
    console.error('getCouponForVerification exception:', error);
    return null;
  }
}
