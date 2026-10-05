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

      {/* Primary CTA (Master Prompt Section 9) */}
      <div className="w-full">
        <Link 
          href="/dashboard/coupons/create"
          className="dashboard-create-btn btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 rounded-2xl shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span>+ CREATE COUPON</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link 
          href="/dashboard/verify" 
          className="btn btn-secondary py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl bg-white border border-[#D4AF37]/60 text-[#8b6508] shadow-xs hover:bg-gold-50"
        >
          <svg className="w-4 h-4 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Verify Coupon</span>
        </Link>
        <Link 
          href="/dashboard/coupons" 
          className="btn btn-secondary py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 text-gray-700 shadow-xs hover:bg-gray-50"
        >
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>All Coupons</span>
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

      {/* Recent Coupons List (Latest 5) */}
      <div className="card bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-serif font-bold text-[#3E2723] uppercase tracking-wider">Recent Coupons</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-[#8b6508] border border-[#D4AF37]/30">
              Latest 5
            </span>
          </div>
          <Link href="/dashboard/coupons" className="text-xs font-bold text-[#8b6508] hover:text-[#5a4103] flex items-center gap-1 transition-colors">
            <span>View All</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {(recentCoupons || []).slice(0, 5).length > 0 ? (
            (recentCoupons || []).slice(0, 5).map((coupon: any) => {
              const status = computeDisplayStatus(coupon);
              return (
                <Link
                  key={coupon.id}
                  href={`/dashboard/coupons/${coupon.coupon_code}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gold-50/40 transition-colors group"
                >
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-sm text-[#3E2723] group-hover:text-[#b8860b] transition-colors block">
                      {coupon.coupon_code}
                    </span>
                    <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                      {coupon.customer_name || 'Valued Customer'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="font-bold text-sm text-gray-900 tracking-tight block">
                      {formatCurrency(coupon.value)}
                    </span>
                    <span className={`badge badge-${status.toLowerCase().replace('_', '-')} text-[10px] px-2 py-0.5 font-semibold`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              No coupons created yet.
            </div>
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
