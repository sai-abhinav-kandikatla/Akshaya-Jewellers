'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import type { CouponWithDisplayStatus, DashboardStats } from '@/lib/types';

export default function DashboardClient({
  initialStats,
  recentCoupons,
}: {
  initialStats: DashboardStats;
  recentCoupons: CouponWithDisplayStatus[];
}) {
  const statuses = [
    { label: 'Active', count: initialStats.active_count },
    { label: 'Not Active', count: initialStats.not_active_count },
    { label: 'Claimed', count: initialStats.claimed_count },
    { label: 'Expired', count: initialStats.expired_count },
    { label: 'Cancelled', count: initialStats.cancelled_count },
  ];

  return (
    <div className="dashboard-home">
      <h1 className="sr-only">Dashboard</h1>

      <Link href="/dashboard/coupons/create" className="dashboard-create-link">
        <span aria-hidden="true">+</span>
        <span>Create Coupon</span>
      </Link>

      <div className="dashboard-quick-actions">
        <Link href="/dashboard/verify">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          Verify Coupon
        </Link>
        <Link href="/dashboard/coupons">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" /></svg>
          All Coupons
        </Link>
      </div>

      <section className="dashboard-total" aria-labelledby="dashboard-total-title">
        <h2 id="dashboard-total-title">Total Coupons</h2>
        <p className="dashboard-total-count">{new Intl.NumberFormat('en-IN').format(initialStats.total_count || 0)}</p>
        <p className="dashboard-secondary">All-time coupons</p>
      </section>

      <section className="dashboard-value" aria-labelledby="dashboard-value-title">
        <h2 id="dashboard-value-title">Coupon Value</h2>
        <dl className="dashboard-value-grid">
          <div>
            <dt>Total</dt>
            <dd>{formatCurrency(initialStats.total_value || 0)}</dd>
          </div>
          <div>
            <dt>Claimed</dt>
            <dd>{formatCurrency(initialStats.claimed_value || 0)}</dd>
          </div>
          <div>
            <dt>Pending</dt>
            <dd>{formatCurrency((initialStats.active_value || 0) + (initialStats.not_active_value || 0))}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-status" aria-labelledby="dashboard-status-title">
        <h2 id="dashboard-status-title">Status</h2>
        <dl>
          {statuses.map(({ label, count }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{new Intl.NumberFormat('en-IN').format(count || 0)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="dashboard-recent" aria-labelledby="dashboard-recent-title">
        <div className="dashboard-section-heading">
          <h2 id="dashboard-recent-title">Recent Coupons</h2>
          <Link href="/dashboard/coupons">View all</Link>
        </div>

        {recentCoupons.length === 0 ? (
          <p className="dashboard-empty">No coupons yet.</p>
        ) : (
          <div className="dashboard-recent-list">
            {recentCoupons.slice(0, 5).map((coupon) => {
              const status = computeDisplayStatus(coupon);
              return (
                <Link key={coupon.id} href={`/dashboard/coupons/${coupon.coupon_code}`} className="dashboard-recent-row">
                  <span className="dashboard-recent-customer">
                    <span className="dashboard-recent-code">{coupon.coupon_code}</span>
                    <span className="dashboard-secondary">{coupon.customer_name}</span>
                  </span>
                  <span className="dashboard-recent-value">{formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}</span>
                  <span className={`dashboard-status-label dashboard-status-label--${status.toLowerCase().replace('_', '-')}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <span className="dashboard-row-arrow" aria-hidden="true">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
