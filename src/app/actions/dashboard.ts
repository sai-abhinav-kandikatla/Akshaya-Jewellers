'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DashboardStats, CouponWithDisplayStatus } from '@/lib/types';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';

export async function getDashboardStats(campaignId?: string): Promise<DashboardStats> {
  const fallbackStats: DashboardStats = {
    total_count: 0,
    active_count: 0,
    not_active_count: 0,
    claimed_count: 0,
    expired_count: 0,
    cancelled_count: 0,
    total_value: 0,
    active_value: 0,
    claimed_value: 0,
    expired_value: 0,
  };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_dashboard_stats', { p_campaign_id: campaignId || null });

    if (!error && data) {
      return data as DashboardStats;
    }

    // Direct table fallback if RPC fails or is missing
    const { data: coupons, error: queryError } = await supabase.from('coupons').select('*');
    if (queryError || !coupons) {
      return fallbackStats;
    }

    const stats = { ...fallbackStats };
    stats.total_count = coupons.length;

    for (const c of coupons) {
      const val = Number(c.coupon_value || c.value || 0);
      stats.total_value += val;

      const status = computeDisplayStatus(c.status, c.valid_from, c.valid_until);
      if (status === 'ACTIVE') {
        stats.active_count++;
        stats.active_value += val;
      } else if (status === 'NOT_ACTIVE') {
        stats.not_active_count++;
      } else if (status === 'CLAIMED') {
        stats.claimed_count++;
        stats.claimed_value += val;
      } else if (status === 'EXPIRED') {
        stats.expired_count++;
        stats.expired_value += val;
      } else if (status === 'CANCELLED') {
        stats.cancelled_count++;
      }
    }

    return stats;
  } catch (error) {
    console.error('getDashboardStats exception:', error);
    return fallbackStats;
  }
}

export async function getRecentCoupons(limit: number = 10): Promise<CouponWithDisplayStatus[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*, campaigns(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getRecentCoupons error:', error);
      return [];
    }

    return (data || []).map((c: any) => ({
      ...c,
      campaign_name: c.campaigns?.name,
      display_status: computeDisplayStatus(c.status, c.valid_from, c.valid_until)
    }));
  } catch (error) {
    console.error('getRecentCoupons exception:', error);
    return [];
  }
}
