'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getCoupons } from '@/app/actions/coupons';
import { getCampaigns } from '@/app/actions/campaigns';
import { exportToCSV } from '@/lib/utils/csvExport';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { Coupon, Campaign } from '@/lib/types';

export default function CouponsListPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const statuses = ['ALL', 'ACTIVE', 'NOT ACTIVE', 'CLAIMED', 'EXPIRED', 'CANCELLED'];

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await getCampaigns();
        if (data) setCampaigns(data);
      } catch (err) {
        console.error('Failed to fetch campaigns', err);
      }
    }
    loadCampaigns();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: debouncedSearch,
        status: filterStatus !== 'ALL' ? filterStatus.replace(' ', '_') : undefined,
        campaignId: campaignFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: ITEMS_PER_PAGE
      };
      
      const { coupons: dataCoupons, total: dataTotal } = await getCoupons(filters);
      setCoupons(dataCoupons || []);
      setTotalCount(dataTotal || 0);
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filterStatus, campaignFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleExport = () => {
    const exportData = coupons.map(c => ({
      'Coupon Code': c.coupon_code,
      'Customer Name': c.customer_name,
      'Phone': c.phone_number,
      'Value': c.value,
      'Campaign': c.campaign_id ? campaigns.find(camp => camp.id === c.campaign_id)?.name || c.campaign_id : '',
      'Valid From': c.valid_from,
      'Valid Until': c.valid_until,
      'Status': computeDisplayStatus(c),
      'Created At': c.created_at,
      'Claimed At': c.claimed_at || ''
    }));
    
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `akshaya-coupons-${dateStr}.csv`);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('ALL');
    setCampaignFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="dashboard-layout">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>All Coupons</h1>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>Total {totalCount} coupons found</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExport} className="btn btn-secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <Link href="/dashboard/coupons/create" className="btn btn-primary">
            + Create
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="search-input-wrapper" style={{ position: 'relative', marginBottom: '1rem' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search coupon, customer, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            {statuses.map(status => (
              <button
                key={status}
                className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
                onClick={() => { setFilterStatus(status); setPage(1); }}
                style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  border: '1px solid #e5e7eb',
                  background: filterStatus === status ? '#d4af37' : '#f9fafb',
                  color: filterStatus === status ? '#fff' : '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </button>
          </div>

          {showAdvancedFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: '#fdfbf7', borderRadius: '8px', border: '1px solid #f3e8c9' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.875rem' }}>Campaign</label>
                <select className="form-input" value={campaignFilter} onChange={e => { setCampaignFilter(e.target.value); setPage(1); }}>
                  <option value="">All Campaigns</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.875rem' }}>Valid From (After)</label>
                <input type="date" className="form-input" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.875rem' }}>Valid Until (Before)</label>
                <input type="date" className="form-input" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={clearFilters} style={{ width: '100%' }}>Clear Filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div className="loading-spinner" />
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading coupons...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '0.5rem' }}>No coupons found</h3>
          <p className="text-muted">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="card" style={{ overflowX: 'auto', display: 'block' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr className="table-header" style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', backgroundColor: '#f9fafb' }}>
                  <th className="table-cell" style={{ padding: '1rem' }}>Code</th>
                  <th className="table-cell" style={{ padding: '1rem' }}>Customer</th>
                  <th className="table-cell" style={{ padding: '1rem' }}>Phone</th>
                  <th className="table-cell" style={{ padding: '1rem' }}>Value</th>
                  <th className="table-cell" style={{ padding: '1rem' }}>Validity</th>
                  <th className="table-cell" style={{ padding: '1rem' }}>Status</th>
                  <th className="table-cell" style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => {
                  const status = computeDisplayStatus(coupon);
                  return (
                    <tr key={coupon.id} className="table-row" style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="table-cell" style={{ padding: '1rem' }}>
                        <Link href={`/dashboard/coupons/${coupon.coupon_code}`} style={{ fontWeight: 'bold', color: '#d4af37', textDecoration: 'none' }}>
                          {coupon.coupon_code}
                        </Link>
                      </td>
                      <td className="table-cell" style={{ padding: '1rem' }}>{coupon.customer_name}</td>
                      <td className="table-cell" style={{ padding: '1rem' }}>{coupon.phone_number}</td>
                      <td className="table-cell" style={{ padding: '1rem', fontWeight: 'bold' }}>{formatCurrency(coupon.value)}</td>
                      <td className="table-cell" style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {formatIndianDate(coupon.valid_from)} &rarr; {formatIndianDate(coupon.valid_until)}
                      </td>
                      <td className="table-cell" style={{ padding: '1rem' }}>
                        <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`}>{status}</span>
                      </td>
                      <td className="table-cell" style={{ padding: '1rem', textAlign: 'right' }}>
                        <Link href={`/dashboard/coupons/${coupon.coupon_code}`} className="btn btn-sm btn-ghost">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} entries
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={page * ITEMS_PER_PAGE >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
