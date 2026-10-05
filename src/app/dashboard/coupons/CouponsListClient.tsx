'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getCoupons } from '@/app/actions/coupons';
import { exportToCSV } from '@/lib/utils/csvExport';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { Coupon, Campaign } from '@/lib/types';

export default function CouponsListClient({
  initialCoupons,
  initialTotal,
  initialCampaigns,
}: {
  initialCoupons: Coupon[];
  initialTotal: number;
  initialCampaigns: Campaign[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isLoading, setIsLoading] = useState(false);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const ITEMS_PER_PAGE = 20;

  const statuses = ['ALL', 'ACTIVE', 'NOT ACTIVE', 'CLAIMED', 'EXPIRED', 'CANCELLED'];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: debouncedSearch,
        status: filterStatus !== 'ALL' ? filterStatus.replace(' ', '_') : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      };
      const res = await getCoupons(filters);
      setCoupons(res.coupons);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterStatus, page]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleExport = () => {
    exportToCSV(coupons);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="space-y-4 max-w-[430px] mx-auto w-full pb-8">
      {/* 
        ==================================================
        17. COUPON LIST HEADER
        ==================================================
      */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#111111]">Coupons</h1>
          <p className="text-xs text-[#666666]">{totalCount} total coupons</p>
        </div>

        <button
          onClick={handleExport}
          className="h-9 px-3 rounded-xl bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111] hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center">
        <svg className="w-4 h-4 text-[#666666] absolute left-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-[#E7E0CF] bg-white text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#C9A227] transition-colors"
          placeholder="Search code, customer or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Horizontally Scrollable Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {statuses.map((status) => {
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-white shadow-2xs'
                  : 'bg-white border border-[#E7E0CF] text-[#666666] hover:text-[#111111]'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Coupons Clean List (Mobile Only) */}
      {isLoading ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#666666]">Loading coupons…</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E7E0CF]">
          <p className="text-sm font-semibold text-[#111111]">No coupons found</p>
          <p className="text-xs text-[#666666] mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {coupons.map((coupon) => {
            const status = computeDisplayStatus(coupon);

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
                className="block p-3.5 bg-white rounded-2xl border border-[#E7E0CF] shadow-2xs hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm text-[#111111]">
                    {coupon.coupon_code}
                  </span>
                  <span className="font-bold text-sm text-[#111111]">
                    {formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#666666] truncate font-medium">
                    {coupon.customer_name} • {coupon.phone_number}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F2EDE2] text-[11px] text-[#666666]">
                  <span>
                    Valid: {formatIndianDate(coupon.valid_from)} → {formatIndianDate(coupon.valid_until)}
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-3 rounded-xl bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111] disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-[#666666]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 px-3 rounded-xl bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
