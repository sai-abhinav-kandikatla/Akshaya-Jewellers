'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';
import { computeDisplayStatus, getStatusLabel } from '@/lib/utils/statusCompute';

export default function DashboardClient({ initialStats, recentCoupons }: any) {
  const [greeting] = useState(() => {
    const hourStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' });
    const hour = parseInt(hourStr, 10);
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#3E2723]">
          {greeting}, Admin 👋
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Akshaya Jewellery Digital Gift Coupon System
        </p>
      </div>

      <nav className="dashboard-quick-actions" aria-label="Quick actions">
        <Link href="/dashboard/coupons/create" className="dashboard-quick-action dashboard-quick-action--create">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M12 4v16m8-8H4" /></svg>
          <span>Create coupon</span>
        </Link>
        <Link href="/dashboard/verify" className="dashboard-quick-action dashboard-quick-action--verify">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true"><path d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          <span>Verify coupon</span>
        </Link>
        <Link href="/dashboard/coupons" className="dashboard-quick-action dashboard-quick-action--coupons">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span>All coupons</span>
        </Link>
      </nav>

      {/* Primary CTA (Master Prompt Section 9) */}
      <div className="w-full">
        <Link 
          href="/dashboard/coupons/create"
          className="dashboard-create-btn btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span>+ CREATE COUPON</span>
        </Link>
      </div>

      {/* Featured Total Coupons Card */}
      <div className="dashboard-total-card card bg-[#3E2723] text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-300 font-semibold">Total Coupons Created</p>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37] mt-1">
            {new Intl.NumberFormat('en-IN').format(initialStats?.total_count || 0)}
          </p>
        </div>
        <div className="dashboard-total-value-desktop text-right">
          <p className="text-xs text-gray-300">Total Value</p>
          <p className="text-lg font-bold text-white">{formatCurrency(initialStats?.total_value || 0)}</p>
        </div>
      </div>

      {/* Compact 2-Column Mobile Metric Grid (Master Prompt Section 8) */}
      <div className="dashboard-stat-section">
        <h2 className="dashboard-stat-heading text-sm font-bold uppercase tracking-wider text-gray-600 mb-2">Coupon Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CompactStatCard title="ACTIVE" count={initialStats?.active_count || 0} color="border-l-4 border-green-500 bg-green-50/40" textColor="text-green-700" />
        <CompactStatCard title="CLAIMED" count={initialStats?.claimed_count || 0} color="border-l-4 border-blue-500 bg-blue-50/40" textColor="text-blue-700" />
        <CompactStatCard title="EXPIRED" count={initialStats?.expired_count || 0} color="border-l-4 border-red-500 bg-red-50/40" textColor="text-red-700" />
        <CompactStatCard title="CANCELLED" count={initialStats?.cancelled_count || 0} color="border-l-4 border-gray-400 bg-gray-50" textColor="text-gray-700" />
        <div className="hidden-mobile"><CompactStatCard title="CLAIMED VALUE" count={formatCurrency(initialStats?.claimed_value || 0)} color="border-l-4 border-[#D4AF37] bg-gold-50/40" textColor="text-[#b8860b]" isValueOnly /></div>
      </div>
      </div>

      <div className="dashboard-value-summary card bg-white border border-gray-200 rounded-2xl shadow-sm grid grid-cols-2 divide-x divide-gray-100 md:hidden">
        <div className="p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Value</p>
          <p className="text-lg font-bold text-[#3E2723] mt-1">{formatCurrency(initialStats?.total_value || 0)}</p>
        </div>
        <div className="p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Claimed Value</p>
          <p className="text-lg font-bold text-[#8b6600] mt-1">{formatCurrency(initialStats?.claimed_value || 0)}</p>
        </div>
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
