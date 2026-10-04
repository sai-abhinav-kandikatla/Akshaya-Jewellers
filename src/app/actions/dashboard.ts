'use server'

import { createClient } from '@/lib/supabase/server';
import { DashboardStats, CouponWithDisplayStatus } from '@/lib/types';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';

export async function getDashboardStats(campaignId?: string): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_dashboard_stats', { p_campaign_id: campaignId || null });

    if (error) {
      console.error('getDashboardStats rpc error:', error);
      throw new Error(error.message);
    }

    return data as DashboardStats;
  } catch (error) {
    console.error('getDashboardStats exception:', error);
    throw new Error('Failed to fetch dashboard stats.');
  }
}

export async function getRecentCoupons(limit: number = 10): Promise<CouponWithDisplayStatus[]> {
  try {
    const supabase = await createClient();
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
