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

  let expiredCount = 0;
  if (dueCoupons?.length) {
    const { data: expiredCoupons, error: updateError } = await supabase
      .from('coupons')
      .update({ status: 'EXPIRED', excel_sync_status: 'PENDING', excel_synced_at: null })
      .in('id', dueCoupons.map((coupon) => coupon.id))
      .eq('status', 'ACTIVE')
      .lt('valid_until', today)
      .select('id');

    if (updateError) {
      console.error('Coupon expiry update failed:', updateError);
      return Response.json({ success: false, error: 'Unable to expire coupons.' }, { status: 500 });
    }
    expiredCount = expiredCoupons?.length || 0;
  }

  const { data: couponsToSync, error: pendingQueryError } = await supabase
    .from('coupons')
    .select('*')
    .in('excel_sync_status', ['PENDING', 'ERROR'])
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (pendingQueryError) {
    console.error('Excel retry queue query failed:', pendingQueryError);
    return Response.json({ success: false, error: 'Unable to load pending Excel updates.' }, { status: 500 });
  }

  const retryBatch = couponsToSync || [];
  const syncResults = await syncCouponsToExcel(retryBatch);
  const excelUpdated = syncResults.filter((result) => result.success).length;

  return Response.json({
    success: true,
    today,
    expired: expiredCount,
    attempted: retryBatch.length,
    excelUpdated,
    excelPending: retryBatch.length - excelUpdated,
  });
}
