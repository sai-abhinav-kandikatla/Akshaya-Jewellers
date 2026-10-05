'use server'

import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Coupon, CouponWithDisplayStatus, CreateCouponInput, CouponFilters } from '@/lib/types';
import { generateCouponCode } from '@/lib/utils/couponCode';
import { computeDisplayStatus, getISTDateString } from '@/lib/utils/statusCompute';
import { isUuid } from '@/lib/utils/identifiers';
import { isValidIndianMobile, isValidCustomerName, isValidCouponValue, normalizePhone } from '@/lib/utils/validators';
import { writeAuditEvent } from '@/lib/audit/events';
import { sendWhatsAppCloudAPI } from './whatsapp';
import { isAdminAuthenticated } from '@/lib/auth/requireAdmin';

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}


export async function createCoupon(input: CreateCouponInput): Promise<ApiResponse<Coupon>> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized. Please sign in and try again.' };
    const supabase = createAdminClient();

    if (!input || typeof input !== 'object') {
      return { success: false, error: 'Customer name, phone, value, valid from, and valid until dates are required.' };
    }

    const customerName = typeof input.customer_name === 'string' ? input.customer_name.trim() : '';
    const rawValue = input.coupon_value ?? input.discount_value ?? 0;
    const val = Number(rawValue);
    if (!isValidCustomerName(customerName) || !input.phone_number || !isValidCouponValue(val) || !Number.isFinite(val) || val > 99_999_999.99 || !input.valid_from || !input.valid_until) {
      return { success: false, error: 'Enter a customer name, valid Indian mobile number, coupon value above ₹0, and both validity dates.' };
    }

    if (!isValidIsoDate(input.valid_from) || !isValidIsoDate(input.valid_until) || input.valid_until < input.valid_from) {
      return { success: false, error: 'Enter valid dates. Valid Until cannot be before Valid From.' };
    }

    if (input.campaign_id && !isUuid(input.campaign_id)) {
      return { success: false, error: 'Select a valid campaign.' };
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
        created: false,
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
          customer_name: customerName,
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
              created: false,
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

    // Send the response as soon as the coupon is saved; these side effects
    // continue in the background and no longer delay the Generate button.
    after(async () => {
      await Promise.allSettled([
        sendWhatsAppCloudAPI(coupon),
        writeAuditEvent('COUPON_CREATED', coupon.id, input.campaign_id || undefined, {
          customer_name: coupon.customer_name,
          phone_number: coupon.phone_number,
          code: coupon.coupon_code
        }),
      ]);
    });

    return { success: true, created: true, message: 'Coupon created successfully', data: coupon };
  } catch (error: any) {
    console.error('createCoupon exception:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred while creating the coupon.' };
  }
}

export async function getCoupons(filters: CouponFilters): Promise<{ coupons: CouponWithDisplayStatus[], total: number }> {
  if (!(await isAdminAuthenticated())) return { coupons: [], total: 0 };
  try {
    const supabase = createAdminClient();
    const istStr = getISTDateString();
    filters = filters && typeof filters === 'object' ? filters : {};

    let query = supabase.from('coupons').select('*', { count: 'exact' });

    if (typeof filters.search === 'string' && filters.search.trim()) {
      const search = filters.search.trim().replace(/[(),]/g, ' ').slice(0, 100);
      query = query.or(`coupon_code.ilike.%${search}%,customer_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
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

    const page = Number.isInteger(filters.page) && (filters.page ?? 0) > 0 ? filters.page! : 1;
    const requestedLimit = filters.limit || filters.per_page || 10;
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 10;
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
  if (!(await isAdminAuthenticated())) throw new Error('Unauthorized. Please sign in and try again.');
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




function mutationFallbackUnavailable(error: { code?: string; message?: string }) {
  return error.code !== 'PGRST202' && error.code !== '42883';
}

export async function claimCoupon(identifier: string): Promise<ApiResponse> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized. Please sign in to redeem coupons.' };
    if (typeof identifier !== 'string' || !identifier.trim()) return { success: false, error: 'Enter a coupon code.' };
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
      if (rpcResult?.success !== true) {
        return { success: false, error: rpcResult?.message || 'The coupon claim was not confirmed. Please verify its status and try again.' };
      }

      const { data: savedCoupon, error: statusError } = await supabase
        .from('coupons')
        .select('status')
        .eq('id', coupon.id)
        .maybeSingle();
      if (!statusError && savedCoupon && savedCoupon.status !== 'CLAIMED') {
        return { success: false, error: 'The coupon is still active. Its claim was not saved; refresh and try again.' };
      }

      return {
        success: true,
        message: 'Coupon redeemed successfully.',
        ...(statusError ? { warning: 'The claim was accepted, but the updated status could not be reloaded.' } : {}),
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
      .update({ status: 'CLAIMED', claimed_at: new Date().toISOString() })
      .eq('id', coupon.id)
      .eq('status', 'ACTIVE')
      .lte('valid_from', today)
      .gte('valid_until', today)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'This coupon is no longer active and cannot be redeemed.' };
    }

    await writeAuditEvent('COUPON_CLAIMED', updated.id, updated.campaign_id || undefined, { coupon_code: updated.coupon_code });

    return {
      success: true,
      message: 'Coupon redeemed successfully.',
    };
  } catch (error: any) {
    console.error('claimCoupon exception:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred while claiming the coupon.' };
  }
}

export async function cancelCoupon(identifier: string, reason?: string): Promise<ApiResponse> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized. Please sign in to cancel coupons.' };
    if (typeof identifier !== 'string' || !identifier.trim()) return { success: false, error: 'Enter a coupon code.' };
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

    const { data: rpcResult, error: rpcError } = await supabase.rpc('cancel_coupon', { p_coupon_code: coupon.coupon_code, p_reason: reason?.trim().slice(0, 500) || null });
    if (!rpcError) {
      if (rpcResult?.success === false) {
        return { success: false, error: rpcResult.message || 'This coupon could not be cancelled.' };
      }
      return {
        success: true,
        message: 'Coupon cancelled successfully.',
      };
    }

    if (mutationFallbackUnavailable(rpcError)) {
      console.error('cancelCoupon RPC error:', rpcError);
      return { success: false, error: 'Could not cancel this coupon. Please try again.' };
    }

    const today = getISTDateString();
    const { data: updated, error: updateError } = await supabase
      .from('coupons')
      .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
      .eq('id', coupon.id)
      .eq('status', 'ACTIVE')
      .gte('valid_until', today)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || rpcError?.message || 'Failed to cancel coupon.' };
    }

    await writeAuditEvent('COUPON_CANCELLED', updated.id, updated.campaign_id || undefined, {
      coupon_code: updated.coupon_code,
      reason: reason?.trim().slice(0, 500) || null,
    });

    return {
      success: true,
      message: 'Coupon cancelled successfully.',
    };
  } catch (error: any) {
    console.error('cancelCoupon exception:', error);
    return { success: false, error: error?.message || 'An unexpected error occurred while cancelling the coupon.' };
  }
}
