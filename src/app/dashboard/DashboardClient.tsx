'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';
import { computeDisplayStatus, getStatusLabel } from '@/lib/utils/statusCompute';

export default function DashboardClient({ initialStats, recentCoupons }: any) {
  return (
    <div className="space-y-4 max-w-xl mx-auto pb-6">
      {/* 1. Primary CTA Banner: Create a new Digital Gift Coupon */}
      <Link
        href="/dashboard/coupons/create"
        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#FFF5DC] via-[#FFF9EE] to-[#FFF3D6] border border-[#F3E5C2] shadow-xs hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-13 h-13 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE8B2] to-[#FAD480] shadow-xs text-3xl">
            🎁
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Create a new</p>
            <h2 className="text-lg font-serif font-bold text-[#2A1E17] leading-tight">Digital Gift Coupon</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">Generate and send via WhatsApp instantly</p>
          </div>
        </div>
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white shadow-md group-hover:scale-105 transition-transform ml-2">
          <svg className="w-5 h-5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>

      {/* 2. Quick Action Secondary Buttons (Verify & All Coupons) */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/verify"
          className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#F0E6D2] shadow-2xs hover:shadow-xs hover:border-[#D4AF37]/50 transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#2E7D32] text-white shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M8.5 11l1.5 1.5 3-3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#2A1E17] truncate">Verify Coupon</p>
              <p className="text-[10px] text-gray-500 truncate">Check coupon status</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-[#C5A059] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/dashboard/coupons"
          className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#F0E6D2] shadow-2xs hover:shadow-xs hover:border-[#D4AF37]/50 transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#5D4037] text-white shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
                <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                <circle cx="4" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#2A1E17] truncate">All Coupons</p>
              <p className="text-[10px] text-gray-500 truncate">View and manage</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-[#C5A059] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* 3. Featured Card: TOTAL COUPONS CREATED with Trend Bars */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F0E6D2] shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">TOTAL COUPONS CREATED</p>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#1A110D] mt-0.5">
            {new Intl.NumberFormat('en-IN').format(initialStats?.total_count || 0)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Across all campaigns</p>
        </div>
        {/* Gold Bar Graph Graphic */}
        <div className="flex items-end gap-1.5 h-14 pr-1">
          {[18, 30, 22, 45, 38, 58, 72, 92].map((heightPct, idx) => (
            <div
              key={idx}
              style={{ height: `${heightPct}%` }}
              className="w-2 sm:w-2.5 rounded-full bg-gradient-to-t from-[#E2BA49] via-[#F5D886] to-[#FDF4DC]"
            />
          ))}
        </div>
      </div>

      {/* 4. COUPON VALUE OVERVIEW (2x2 Grid) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-[#2A1E17]">
            COUPON VALUE OVERVIEW
          </h2>
          <span className="text-[11px] font-bold text-[#8B6508]">
            INR (₹)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Total Value */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF4] border border-[#FBEEC8] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#E5A91A] text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <ellipse cx="12" cy="6" rx="7" ry="2.5" />
                <path d="M5 6v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V6" />
                <path d="M5 10.5v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-4" />
                <path d="M5 15v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-500 font-medium truncate">Total Value</p>
              <p className="text-base sm:text-lg font-bold text-[#1A110D] tracking-tight truncate mt-0.5" title={formatCurrency(initialStats?.total_value || 0)}>
                {formatCurrency(initialStats?.total_value || 0)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">Sum of all coupons</p>
            </div>
          </div>

          {/* Not Active Value */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8F3] border border-[#FDE3CF] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#D9531E] text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-500 font-medium truncate">Not Active Value</p>
              <p className="text-base sm:text-lg font-bold text-[#8D3B0D] tracking-tight truncate mt-0.5" title={formatCurrency(initialStats?.not_active_value || 0)}>
                {formatCurrency(initialStats?.not_active_value || 0)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">Yet to be active</p>
            </div>
          </div>

          {/* Claimed Value */}
          <div className="p-3.5 rounded-2xl bg-[#F4FAF6] border border-[#CEEEDC] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#1E8E3E] text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5 stroke-[2.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-500 font-medium truncate">Claimed Value</p>
              <p className="text-base sm:text-lg font-bold text-[#0E6228] tracking-tight truncate mt-0.5" title={formatCurrency(initialStats?.claimed_value || 0)}>
                {formatCurrency(initialStats?.claimed_value || 0)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">Redeemed coupons</p>
            </div>
          </div>

          {/* Expired Value */}
          <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#FDD5D5] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#D93025] text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-500 font-medium truncate">Expired Value</p>
              <p className="text-base sm:text-lg font-bold text-[#9E1B1B] tracking-tight truncate mt-0.5" title={formatCurrency(initialStats?.expired_value || 0)}>
                {formatCurrency(initialStats?.expired_value || 0)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">Past validity</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. COUPON STATUS OVERVIEW (4 Cards side-by-side) */}
      <div>
        <h2 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-[#2A1E17] mb-2">
          COUPON STATUS OVERVIEW
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {/* Not Active */}
          <div className="p-2.5 rounded-2xl bg-[#F0FAF4] border border-[#D3F3E1] shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[#1E8E3E] text-white flex items-center justify-center shadow-xs">
              <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-600 font-medium truncate">Not Active</p>
              <p className="text-base sm:text-lg font-bold text-[#1A110D] leading-tight mt-0.5">
                {initialStats?.not_active_count || 0}
              </p>
            </div>
          </div>

          {/* Claimed */}
          <div className="p-2.5 rounded-2xl bg-[#EDF4FE] border border-[#CCE0FD] shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[#1A73E8] text-white flex items-center justify-center shadow-xs">
              <svg className="w-3.5 h-3.5 stroke-white stroke-[3]" viewBox="0 0 24 24" fill="none">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#1A56A0] font-medium truncate">Claimed</p>
              <p className="text-base sm:text-lg font-bold text-[#1A110D] leading-tight mt-0.5">
                {initialStats?.claimed_count || 0}
              </p>
            </div>
          </div>

          {/* Expired */}
          <div className="p-2.5 rounded-2xl bg-[#FDF1F0] border border-[#F8D0CD] shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[#D93025] text-white flex items-center justify-center shadow-xs">
              <svg className="w-3.5 h-3.5 stroke-white stroke-[2.2]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-600 font-medium truncate">Expired</p>
              <p className="text-base sm:text-lg font-bold text-[#1A110D] leading-tight mt-0.5">
                {initialStats?.expired_count || 0}
              </p>
            </div>
          </div>

          {/* Cancelled */}
          <div className="p-2.5 rounded-2xl bg-[#F1F3F4] border border-[#DADCE0] shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[#5F6368] text-white flex items-center justify-center shadow-xs">
              <svg className="w-3 h-3 stroke-white stroke-[3]" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-600 font-medium truncate">Cancelled</p>
              <p className="text-base sm:text-lg font-bold text-[#1A110D] leading-tight mt-0.5">
                {initialStats?.cancelled_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. RECENT COUPONS (Clean List Matching Mockup) */}
      <div className="bg-white rounded-2xl border border-[#F0E6D2] shadow-2xs overflow-hidden">
        <div className="px-4 py-3.5 flex justify-between items-center border-b border-[#F5EFE6]">
          <h2 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-[#2A1E17]">
            RECENT COUPONS
          </h2>
          <Link href="/dashboard/coupons" className="text-xs font-bold text-[#8B6508] hover:text-[#5A4103] flex items-center gap-1 transition-colors">
            <span>View All</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="divide-y divide-[#F5EFE6]">
          {(recentCoupons || []).slice(0, 5).length > 0 ? (
            (recentCoupons || []).slice(0, 5).map((coupon: any) => {
              const status = computeDisplayStatus(coupon);
              const { date, time } = formatCouponDateTime(coupon.created_at || coupon.valid_from);
              return (
                <Link
                  key={coupon.id}
                  href={`/dashboard/coupons/${coupon.coupon_code}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#FAF7F2] transition-colors group"
                >
                  {/* Left: Code & Customer */}
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-sm text-[#1A110D] group-hover:text-[#B8860B] transition-colors block">
                      {coupon.coupon_code}
                    </span>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                      {coupon.customer_name || 'Valued Customer'}
                    </p>
                  </div>

                  {/* Right: Value, Status, Date/Time & Chevron */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-sm text-[#1A110D]">
                        {formatCurrency(coupon.value)}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wide ${
                        status === 'NOT_ACTIVE' ? 'bg-[#FEF3D6] text-[#B4690E]' :
                        status === 'CLAIMED' ? 'bg-[#E6F4EA] text-[#137333]' :
                        status === 'ACTIVE' ? 'bg-[#E6F4EA] text-[#137333]' :
                        status === 'CANCELLED' ? 'bg-[#F1F3F4] text-[#5F6368]' :
                        'bg-[#FCE8E6] text-[#C5221F]'
                      }`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end min-w-[65px] sm:min-w-[70px]">
                      <span className="text-[10px] text-gray-400 font-medium leading-tight">
                        {date}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                        {time}
                      </span>
                    </div>

                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
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

function formatCouponDateTime(dateStr?: string) {
  if (!dateStr) return { date: '', time: '' };
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    return { date, time };
  } catch {
    return { date: dateStr, time: '' };
  }
}
