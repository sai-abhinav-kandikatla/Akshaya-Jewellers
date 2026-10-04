'use server'

import { createClient } from '@/lib/supabase/server';
import { AuditLog } from '@/lib/types';

export async function logAuditEvent(action: string, couponId?: string, campaignId?: string, details?: Record<string, unknown>): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        user_id: userId || null,
        coupon_id: couponId || null,
        campaign_id: campaignId || null,
        details: details || null
      });

    if (error) {
      console.error('logAuditEvent error:', error);
    }
  } catch (error) {
    console.error('logAuditEvent exception:', error);
  }
}

export async function getAuditLogs(filters?: { coupon_id?: string, action?: string, page?: number, per_page?: number }): Promise<{ logs: AuditLog[], total: number }> {
  try {
    const supabase = await createClient();
    let query = supabase.from('audit_logs').select('*, coupons(coupon_code, customer_name)', { count: 'exact' });

    if (filters?.coupon_id) {
      query = query.eq('coupon_id', filters.coupon_id);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    const page = filters?.page || 1;
    const limit = filters?.per_page || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('getAuditLogs error:', error);
      return { logs: [], total: 0 };
    }

    return { logs: data as unknown as AuditLog[], total: count || 0 };
  } catch (error) {
    console.error('getAuditLogs exception:', error);
    return { logs: [], total: 0 };
  }
}

export async function getCouponAuditHistory(couponId: string): Promise<AuditLog[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('coupon_id', couponId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getCouponAuditHistory error:', error);
      return [];
    }

    return data as AuditLog[];
  } catch (error) {
    console.error('getCouponAuditHistory exception:', error);
    return [];
  }
}
