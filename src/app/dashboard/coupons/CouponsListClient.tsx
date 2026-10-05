'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getCoupons } from '@/app/actions/coupons';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import type { Coupon } from '@/lib/types';

const ITEMS_PER_PAGE = 20;
const statuses = ['ALL', 'ACTIVE', 'NOT ACTIVE', 'CLAIMED', 'EXPIRED', 'CANCELLED'];

export default function CouponsListClient({
  initialCoupons,
  initialTotal,
}: {
  initialCoupons: Coupon[];
  initialTotal: number;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const filterKey = JSON.stringify([debouncedSearch, filterStatus, page]);
  const lastLoadedFilterKey = useRef(filterKey);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await getCoupons({
        search: debouncedSearch,
        status: filterStatus !== 'ALL' ? filterStatus.replace(' ', '_') : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setCoupons(result.coupons);
      setTotalCount(result.total);
    } catch {
      setLoadError('Coupons could not be loaded. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterStatus, page]);

  useEffect(() => {
    if (lastLoadedFilterKey.current === filterKey) return;
    lastLoadedFilterKey.current = filterKey;
    void loadCoupons();
  }, [filterKey, loadCoupons]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="coupon-list-page">
      <header className="coupon-list-heading">
        <h1>Coupons</h1>
        <p>{new Intl.NumberFormat('en-IN').format(totalCount)} coupons</p>
      </header>

      <label className="sr-only" htmlFor="couponSearch">Search coupons</label>
      <input
        id="couponSearch"
        type="search"
        className="coupon-search-input"
        placeholder="Search code, customer or phone"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="coupon-filter-control">
        <label htmlFor="couponStatusFilter">Filters</label>
        <select
          id="couponStatusFilter"
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setPage(1);
          }}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {loadError && <p className="coupon-list-error" role="alert">{loadError}</p>}

      {isLoading ? (
        <p className="coupon-list-state" role="status">Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <div className="coupon-list-state">
          <p>No coupons found.</p>
          <p>Try another search or filter.</p>
        </div>
      ) : (
        <div className="coupon-rows" aria-live="polite">
          {coupons.map((coupon) => {
            const status = computeDisplayStatus(coupon).replace('_', ' ');
            return (
              <Link key={coupon.id} href={`/dashboard/coupons/${coupon.coupon_code}`} className="coupon-row">
                <span className="coupon-row-main">
                  <span className="coupon-row-topline">
                    <span className="coupon-row-code">{coupon.coupon_code}</span>
                    <span className="coupon-row-value">{formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}</span>
                  </span>
                  <span className="coupon-row-bottomline">
                    <span className="coupon-row-customer">{coupon.customer_name}</span>
                    <span className={`coupon-row-status coupon-row-status--${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
                  </span>
                  <span className="coupon-row-validity">Valid until {formatIndianDate(coupon.valid_until)}</span>
                </span>
                <span className="coupon-row-arrow" aria-hidden="true">›</span>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="coupon-pagination" aria-label="Coupon list pages">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next</button>
        </nav>
      )}
    </div>
  );
}
