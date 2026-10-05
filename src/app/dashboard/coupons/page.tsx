import { getCoupons } from '@/app/actions/coupons';
import CouponsListClient from './CouponsListClient';

export default async function CouponsListPage() {
  const couponResult = await getCoupons({ page: 1, limit: 20 });

  return (
    <CouponsListClient
      initialCoupons={couponResult.coupons}
      initialTotal={couponResult.total}
    />
  );
}
