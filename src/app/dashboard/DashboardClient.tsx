'use client';

import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';
import { computeDisplayStatus, getStatusLabel } from '@/lib/utils/statusCompute';
import { getDashboardStats } from '@/app/actions/dashboard';

export default function DashboardClient({ initialStats, recentCoupons, campaigns }: any) {
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [stats, setStats] = useState(initialStats);
  const [statsLoading, setStatsLoading] = useState(false);
  const [greeting, setGreeting] = useState('Good Morning');
  const campaignRequestId = useRef(0);

  useEffect(() => {
    // Determine greeting in IST timezone
    const hourStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' });
    const hour = parseInt(hourStr, 10);
    if (hour >= 5 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleCampaignChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const campaignId = event.target.value;
    const requestId = ++campaignRequestId.current;
    setSelectedCampaign(campaignId);

    if (campaignId === 'all') {
      setStats(initialStats);
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    try {
      const nextStats = await getDashboardStats(campaignId);
      if (requestId === campaignRequestId.current) setStats(nextStats);
    } catch (error) {
      console.error('Failed to load campaign stats', error);
    } finally {
      if (requestId === campaignRequestId.current) setStatsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting & Campaign Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#3E2723]">
            {greeting}, Admin 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Akshaya Jewellery Digital Gift Coupon System
          </p>
        </div>
        <select 
          className="form-input max-w-xs text-sm py-2 px-3 bg-white border border-gray-300 rounded-xl"
          value={selectedCampaign}
          onChange={handleCampaignChange}
          aria-label="Filter dashboard by campaign"
        >
          <option value="all">All Campaigns</option>
          {campaigns?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Primary CTA (Master Prompt Section 9) */}
      <div className="w-full">
        <Link 
          href="/dashboard/coupons/create"
          className="btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span>+ CREATE COUPON</span>
        </Link>
      </div>

      {/* Featured Total Coupons Card */}
      <div className="card bg-[#3E2723] text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-300 font-semibold">Total Coupons Created</p>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37] mt-1">
            {new Intl.NumberFormat('en-IN').format(stats?.total_count || 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-300">Total Value</p>
          <p className="text-lg font-bold text-white">{formatCurrency(stats?.total_value || 0)}</p>
        </div>
      </div>

      {/* Compact 2-Column Mobile Metric Grid (Master Prompt Section 8) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" aria-busy={statsLoading}>
        <CompactStatCard title="ACTIVE" count={stats?.active_count || 0} color="border-l-4 border-green-500 bg-green-50/40" textColor="text-green-700" />
        <CompactStatCard title="NOT ACTIVE" count={stats?.not_active_count || 0} color="border-l-4 border-amber-500 bg-amber-50/40" textColor="text-amber-700" />
        <CompactStatCard title="CLAIMED" count={stats?.claimed_count || 0} value={formatCurrency(stats?.claimed_value || 0)} color="border-l-4 border-blue-500 bg-blue-50/40" textColor="text-blue-700" />
        <CompactStatCard title="EXPIRED" count={stats?.expired_count || 0} color="border-l-4 border-red-500 bg-red-50/40" textColor="text-red-700" />
        <CompactStatCard title="CANCELLED" count={stats?.cancelled_count || 0} color="border-l-4 border-gray-400 bg-gray-50" textColor="text-gray-700" />
        <CompactStatCard title="CLAIMED VALUE" count={formatCurrency(stats?.claimed_value || 0)} color="border-l-4 border-[#D4AF37] bg-gold-50/40" textColor="text-[#b8860b]" isValueOnly />
      </div>

      {/* Recent Coupons List */}
      <div className="card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Recent Coupons</h2>
          <Link href="/dashboard/coupons" className="text-xs font-semibold text-[#b8860b] hover:underline">
            View All →
          </Link>
        </div>

        <div className="p-4 space-y-2">
          {recentCoupons?.length > 0 ? (
            recentCoupons.map((coupon: any) => {
              const status = computeDisplayStatus(coupon);
              return (
                <Link
                  key={coupon.id}
                  href={`/dashboard/coupons/${coupon.coupon_code}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div>
                    <span className="font-bold text-[#b8860b] text-sm block">{coupon.coupon_code}</span>
                    <span className="text-xs font-medium text-gray-800">{coupon.customer_name || 'Valued Customer'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-sm block">{formatCurrency(coupon.value)}</span>
                    <span className={`badge badge-${status.toLowerCase().replace('_', '-')} text-[10px] py-0.5 px-2`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">No coupons created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactStatCard({ title, count, value, color, textColor, isValueOnly }: any) {
  return (
    <div className={`p-3.5 rounded-xl border border-gray-200 shadow-sm ${color}`}>
      <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">{title}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${textColor}`}>
        {isValueOnly ? count : (typeof count === 'number' ? new Intl.NumberFormat('en-IN').format(count) : count)}
      </p>
      {value && <p className="text-[11px] font-semibold text-gray-600 mt-0.5">{value}</p>}
    </div>
  );
}
