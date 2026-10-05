import Link from 'next/link';
import { formatDateShort } from '@/lib/utils/formatters';
import type { Campaign } from '@/lib/types';

export default function CampaignsClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  return (
    <div className="campaign-list-page">
      <header className="campaign-list-heading">
        <div><h1>Campaigns</h1><p>{initialCampaigns.length} campaigns</p></div>
        <Link className="action-primary campaign-create-link" href="/dashboard/campaigns/create">New Campaign</Link>
      </header>

      {initialCampaigns.length === 0 ? (
        <p className="page-state">No campaigns yet.</p>
      ) : (
        <div className="campaign-rows">
          {initialCampaigns.map((campaign) => (
            <article className="campaign-row" key={campaign.id}>
              <div className="campaign-row-title"><h2>{campaign.name}</h2><span>{campaign.status.replace('_', ' ')}</span></div>
              {campaign.description && <p className="campaign-row-description">{campaign.description}</p>}
              <p className="campaign-row-dates">{formatDateShort(campaign.start_date)} – {formatDateShort(campaign.end_date)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
