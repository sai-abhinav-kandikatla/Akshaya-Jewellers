'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { AuditLog, AuditAction } from '@/lib/types';
import { isAdminAuthenticated } from '@/lib/auth/requireAdmin';
import { writeAuditEvent } from '@/lib/audit/events';

export async function logAuditEvent(action: AuditAction, couponId?: string, campaignId?: string, details?: Record<string, unknown>): Promise<void> {
  if (!(await isAdminAuthenticated())) return;
  try {
    await writeAuditEvent(action, couponId, campaignId, details);
  } catch (error) {
    console.error('logAuditEvent exception:', error);
  }
}

export async function getAuditLogs(filters?: { coupon_id?: string, action?: string, page?: number, per_page?: number }): Promise<{ logs: AuditLog[], total: number }> {
  if (!(await isAdminAuthenticated())) return { logs: [], total: 0 };
  try {
    const supabase = createAdminClient();
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

    const logs = (data || []).map((row: any) => ({
      ...row,
      coupon_code: row.coupons?.coupon_code ?? null,
      customer_name: row.coupons?.customer_name ?? null,
    })) as unknown as AuditLog[];
    return { logs, total: count || 0 };
  } catch (error) {
    console.error('getAuditLogs exception:', error);
    return { logs: [], total: 0 };
  }
}

export async function getCouponAuditHistory(couponId: string): Promise<AuditLog[]> {
  if (!(await isAdminAuthenticated())) return [];
  try {
    const supabase = createAdminClient();
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
