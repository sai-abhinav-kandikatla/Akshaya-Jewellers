'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCampaigns } from '@/app/actions/campaigns';
import { formatDateShort } from '@/lib/utils/formatters';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const data = await getCampaigns();
        setCampaigns(data || []);
      } catch (error) {
        console.error('Failed to load campaigns', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="page-header flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Campaigns</h1>
        <Link href="/dashboard/campaigns/create" className="btn btn-primary bg-[#3E2723] hover:bg-[#2D1C19] text-white px-4 py-2 rounded-md shadow flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-[#D4AF37]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first promotional campaign.</p>
          <Link href="/dashboard/campaigns/create" className="btn btn-primary bg-[#D4AF37] hover:bg-[#b8952b] text-white px-6 py-2 rounded-md">
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="card bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
              <div className="card-body p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 truncate pr-4">{campaign.name}</h3>
                  <span className={`badge px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {campaign.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {campaign.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                )}
                <div className="flex flex-col space-y-2 mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{formatDateShort(campaign.start_date)} — {formatDateShort(campaign.end_date)}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    <span>{campaign.coupon_count || 0} Coupons</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
