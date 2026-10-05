import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { AuditAction } from '@/lib/types';

export async function writeAuditEvent(
  action: AuditAction,
  couponId?: string,
  campaignId?: string,
  details?: Record<string, unknown>,
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('audit_logs').insert({
      action,
      user_id: null,
      coupon_id: couponId || null,
      campaign_id: campaignId || null,
      details: details || null,
    });
    if (error) console.error('Audit event insert failed:', error);
  } catch (error) {
    console.error('Audit event insert failed:', error);
  }
}
