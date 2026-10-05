import { createAdminClient } from '@/lib/supabase/admin';
import { getISTDateString } from '@/lib/utils/statusCompute';
import { syncCouponsToExcel } from '@/app/actions/excel';

export const runtime = 'nodejs';

const BATCH_SIZE = 50;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ success: false, error: 'Coupon expiry job is not configured.' }, { status: 503 });
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const today = getISTDateString();
  const supabase = createAdminClient();
  const { data: dueCoupons, error: queryError } = await supabase
    .from('coupons')
    .select('*')
    .eq('status', 'ACTIVE')
    .lt('valid_until', today)
    .order('valid_until', { ascending: true })
    .limit(BATCH_SIZE);

  if (queryError) {
    console.error('Coupon expiry query failed:', queryError);
    return Response.json({ success: false, error: 'Unable to load expired coupons.' }, { status: 500 });
  }

  if (!dueCoupons?.length) {
    return Response.json({ success: true, today, expired: 0, excelUpdated: 0, excelPending: 0 });
  }

  const { data: expiredCoupons, error: updateError } = await supabase
    .from('coupons')
    .update({ status: 'EXPIRED', excel_sync_status: 'PENDING', excel_synced_at: null })
    .in('id', dueCoupons.map((coupon) => coupon.id))
    .eq('status', 'ACTIVE')
    .lt('valid_until', today)
    .select('*');

  if (updateError) {
    console.error('Coupon expiry update failed:', updateError);
    return Response.json({ success: false, error: 'Unable to expire coupons.' }, { status: 500 });
  }

  const couponsToSync = expiredCoupons || [];
  const syncResults = await syncCouponsToExcel(couponsToSync);
  const excelUpdated = syncResults.filter((result) => result.success).length;

  return Response.json({
    success: true,
    today,
    expired: couponsToSync.length,
    excelUpdated,
    excelPending: couponsToSync.length - excelUpdated,
  });
}
