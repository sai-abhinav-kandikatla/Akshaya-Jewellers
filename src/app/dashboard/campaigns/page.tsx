import { getCampaigns } from '@/app/actions/campaigns';
import CampaignsClient from './CampaignsClient';

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  return <CampaignsClient initialCampaigns={campaigns} />;
}
