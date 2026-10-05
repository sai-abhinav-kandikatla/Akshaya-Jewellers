'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';

function formatCouponDateTime(dateStr?: string) {
  if (!dateStr) return { date: '—', time: '—' };
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
    return { date, time };
  } catch {
    return { date: dateStr, time: '' };
  }
}

export default function DashboardClient({ initialStats, recentCoupons }: any) {
  return (
    <div className="space-y-4 max-w-[430px] mx-auto w-full pb-6">
      {/* 
        ==================================================
        8. CREATE COUPON BUTTON (ONE Primary CTA)
        ==================================================
      */}
      <Link
        href="/dashboard/coupons/create"
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-[#111111] px-5 flex items-center justify-between shadow-sm hover:brightness-105 active:brightness-95 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="font-semibold text-base tracking-tight">Create Coupon</span>
        </div>
        <svg className="w-4 h-4 stroke-[2.5] text-[#111111] group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* 
        ==================================================
        9. QUICK ACTIONS (Two Equal Buttons Side by Side)
        ==================================================
      */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/verify"
          className="h-12 px-3.5 rounded-2xl bg-white border border-[#E7E0CF] flex items-center justify-between text-[#111111] hover:bg-gray-50 active:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-[#111111] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-xs font-semibold truncate">Verify Coupon</span>
          </div>
          <svg className="w-3.5 h-3.5 text-[#666666] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/dashboard/coupons"
          className="h-12 px-3.5 rounded-2xl bg-white border border-[#E7E0CF] flex items-center justify-between text-[#111111] hover:bg-gray-50 active:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-[#111111] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="text-xs font-semibold truncate">All Coupons</span>
          </div>
          <svg className="w-3.5 h-3.5 text-[#666666] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* 
        ==================================================
        10. TOTAL COUPONS CARD (Simple, Clean Card)
        ==================================================
      */}
      <div className="p-4 rounded-2xl bg-white border border-[#E7E0CF] flex items-center justify-between shadow-2xs">
        <div>
          <p className="text-xs font-medium text-[#666666]">Total Coupons Created</p>
          <p className="text-3xl font-serif font-bold text-[#111111] mt-0.5">
            {new Intl.NumberFormat('en-IN').format(initialStats?.total_count || 0)}
          </p>
          <p className="text-xs text-[#666666] mt-0.5">Across all campaigns</p>
        </div>

        {/* 8-bar minimal gold trend graphic (Ascending) */}
        <div className="flex items-end gap-1.5 h-11 pr-2" aria-hidden="true">
          <div className="w-1.5 h-2 rounded-t-sm bg-[#E9D9A6]" />
          <div className="w-1.5 h-3 rounded-t-sm bg-[#E5D298]" />
          <div className="w-1.5 h-4.5 rounded-t-sm bg-[#E0CA8A]" />
          <div className="w-1.5 h-5.5 rounded-t-sm bg-[#DCC37C]" />
          <div className="w-1.5 h-7 rounded-t-sm bg-[#D6BA6C]" />
          <div className="w-1.5 h-8.5 rounded-t-sm bg-[#D0B15B]" />
          <div className="w-1.5 h-10 rounded-t-sm bg-[#CBA94B]" />
          <div className="w-1.5 h-11 rounded-t-sm bg-[#C9A227]" />
        </div>
      </div>

      {/* 
        ==================================================
        11. VALUE OVERVIEW (2x2 Clean Grid)
        ==================================================
      */}
      <div>
        <div className="flex justify-between items-center mb-2 px-0.5">
          <h2 className="text-sm font-serif font-bold text-[#111111]">
            Coupon Value Overview
          </h2>
          <span className="text-[11px] text-[#666666]">INR (₹)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Value */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0CF] shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E0CF] flex items-center justify-center flex-shrink-0 text-[#A67C00]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <ellipse cx="12" cy="6" rx="8" ry="3" />
                <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#666666] truncate">Total Value</p>
              <p className="text-sm sm:text-base font-bold text-[#111111] leading-tight truncate">
                {formatCurrency(initialStats?.total_value || 0)}
              </p>
            </div>
          </div>

          {/* Not Active Value */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0CF] shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E0CF] flex items-center justify-center flex-shrink-0 text-[#A67C00]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M5 22h14" />
                <path d="M5 2h14" />
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#666666] truncate">Not Active Value</p>
              <p className="text-sm sm:text-base font-bold text-[#111111] leading-tight truncate">
                {formatCurrency(initialStats?.not_active_value || 0)}
              </p>
            </div>
          </div>

          {/* Claimed Value */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0CF] shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E0CF] flex items-center justify-center flex-shrink-0 text-[#A67C00]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect width="20" height="5" x="2" y="7" />
                <line x1="12" x2="12" y1="22" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#666666] truncate">Claimed Value</p>
              <p className="text-sm sm:text-base font-bold text-[#111111] leading-tight truncate">
                {formatCurrency(initialStats?.claimed_value || 0)}
              </p>
            </div>
          </div>

          {/* Expired Value */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0CF] shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E0CF] flex items-center justify-center flex-shrink-0 text-[#A67C00]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#666666] truncate">Expired Value</p>
              <p className="text-sm sm:text-base font-bold text-[#111111] leading-tight truncate">
                {formatCurrency(initialStats?.expired_value || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ==================================================
        12. STATUS OVERVIEW (Compact Horizontal Row)
        ==================================================
      */}
      <div>
        <h2 className="text-sm font-serif font-bold text-[#111111] mb-2 px-0.5">
          Coupon Status Overview
        </h2>

        <div className="bg-white rounded-2xl border border-[#E7E0CF] p-3 shadow-2xs">
          <div className="grid grid-cols-4 gap-2">
            {/* Not Active */}
            <div className="flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] text-[#A67C00] flex items-center justify-center mb-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-[10px] text-[#666666]">Not Active</p>
              <p className="text-xs font-bold text-[#111111] mt-0.5">
                {initialStats?.not_active_count || 0}
              </p>
            </div>

            {/* Claimed */}
            <div className="flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] text-[#A67C00] flex items-center justify-center mb-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-[10px] text-[#666666]">Claimed</p>
              <p className="text-xs font-bold text-[#111111] mt-0.5">
                {initialStats?.claimed_count || 0}
              </p>
            </div>

            {/* Expired */}
            <div className="flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] text-[#A67C00] flex items-center justify-center mb-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-[10px] text-[#666666]">Expired</p>
              <p className="text-xs font-bold text-[#111111] mt-0.5">
                {initialStats?.expired_count || 0}
              </p>
            </div>

            {/* Cancelled */}
            <div className="flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] text-[#A67C00] flex items-center justify-center mb-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="text-[10px] text-[#666666]">Cancelled</p>
              <p className="text-xs font-bold text-[#111111] mt-0.5">
                {initialStats?.cancelled_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ==================================================
        13. RECENT COUPONS (Clean List Rows Matching Mockup)
        ==================================================
      */}
      <div>
        <div className="flex justify-between items-center mb-2 px-0.5">
          <h2 className="text-sm font-serif font-bold text-[#111111]">
            Recent Coupons
          </h2>
          <Link
            href="/dashboard/coupons"
            className="text-xs font-semibold text-[#A67C00] hover:text-[#C9A227] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E0CF] divide-y divide-[#F2EDE2] shadow-2xs overflow-hidden">
          {(recentCoupons || []).slice(0, 5).length > 0 ? (
            (recentCoupons || []).slice(0, 5).map((coupon: any) => {
              const status = computeDisplayStatus(coupon);
              const { date, time } = formatCouponDateTime(coupon.created_at || coupon.valid_from);

              // Status badge styling adhering strictly to Master Prompt Section 2
              let badgeClass = 'bg-[#FAF8F2] text-[#111111] border border-[#E7E0CF]';
              if (status === 'ACTIVE' || status === 'NOT_ACTIVE') {
                badgeClass = 'bg-[#FDF8E7] text-[#A67C00] border border-[#C9A227]';
              } else if (status === 'EXPIRED' || status === 'CANCELLED') {
                badgeClass = 'bg-[#F5F5F5] text-[#666666] border border-[#E5E5E5]';
              }

              return (
                <Link
                  key={coupon.id}
                  href={`/dashboard/coupons/${coupon.coupon_code}`}
                  className="flex items-center justify-between px-3.5 py-3 hover:bg-[#FAF8F5] transition-colors group"
                >
                  {/* Left: Code & Customer */}
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-xs text-[#111111] block group-hover:text-[#A67C00] transition-colors">
                      {coupon.coupon_code}
                    </span>
                    <p className="text-xs text-[#666666] truncate mt-0.5">
                      {coupon.customer_name || 'Valued Customer'}
                    </p>
                  </div>

                  {/* Middle & Right: Value, Status, Date/Time & Chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-xs text-[#111111]">
                      {formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}>
                      {status.replace('_', ' ')}
                    </span>

                    <div className="text-right text-[10px] text-[#666666] leading-tight hidden xs:block">
                      <p>{date}</p>
                      <p className="text-[9px] text-[#888888]">{time}</p>
                    </div>

                    <svg className="w-3.5 h-3.5 text-[#C9A227] group-hover:translate-x-0.5 transition-transform flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[#666666]">
              No coupons created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
