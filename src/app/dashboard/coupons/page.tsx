import { getCoupons } from '@/app/actions/coupons';
import { getCampaigns } from '@/app/actions/campaigns';
import CouponsListClient from './CouponsListClient';

export default async function CouponsListPage() {
  const [couponResult, campaigns] = await Promise.all([
    getCoupons({ page: 1, limit: 20 }),
    getCampaigns(),
  ]);

  return (
    <CouponsListClient
      initialCoupons={couponResult.coupons}
      initialTotal={couponResult.total}
      initialCampaigns={campaigns}
    />
  );
}
