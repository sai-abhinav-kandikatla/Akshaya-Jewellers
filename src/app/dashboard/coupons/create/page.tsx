import { getCampaigns } from '@/app/actions/campaigns';
import CreateCouponClient from './CreateCouponClient';

export default async function CreateCouponPage() {
  const campaigns = await getCampaigns();
  return <CreateCouponClient campaigns={campaigns} />;
}
