'use client';

import React, { useState } from 'react';
import { getCouponByCode, claimCoupon } from '@/app/actions/coupons';
import { formatCurrency, formatIndianDate, formatDateTime } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { Coupon } from '@/lib/types';

export default function VerifyCouponPage() {
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [toast, setToast] = useState<{ id: number, message: string, type: 'success' | 'error' } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    setCode(val);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    // Auto-format check (prefix AKS- if needed)
    let searchCode = code.trim();
    if (searchCode.match(/^\d+$/) || (!searchCode.startsWith('AKS-') && searchCode.length > 0)) {
      if (!searchCode.startsWith('AKS-')) {
        searchCode = `AKS-${searchCode}`;
      }
    }

    setIsLoading(true);
    setError('');
    setCoupon(null);

    try {
      const data = await getCouponByCode(searchCode);
      if (data) {
        setCoupon(data);
        setCode(searchCode); // Update input to formatted code
      } else {
        setError('Coupon not found. Please check the code and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!coupon) return;
    
    setIsClaiming(true);
    try {
      const result = await claimCoupon(coupon.id);
      if (!result.success) {
        const latest = await getCouponByCode(coupon.coupon_code).catch(() => null);
        if (latest) setCoupon(latest);
        showToast(result.error || result.message || 'Failed to claim coupon.', 'error');
        return;
      }

      // Refresh coupon data
      const updated = await getCouponByCode(coupon.coupon_code);
      if (updated && computeDisplayStatus(updated) === 'CLAIMED') {
        setCoupon(updated);
        showToast('Coupon claimed successfully!', 'success');
      } else {
        if (updated) setCoupon(updated);
        showToast('The claim was not confirmed. This coupon still appears active; refresh and try again.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to claim coupon', 'error');
    } finally {
      setIsClaiming(false);
      setModalOpen(false);
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '✅';
      case 'CLAIMED': return '🎉';
      case 'EXPIRED': return '⏰';
      case 'NOT_ACTIVE': return '⏳';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="dashboard-page verify-page">
      {toast && (
        <div className="toast-container">
          <div role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'} className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal card" style={{ maxWidth: '400px', width: '100%', background: '#fff', borderRadius: '8px', padding: '1.5rem' }}>
            <div className="modal-header">
              <h3 style={{ marginBottom: '1rem', color: '#166534' }}>Confirm Claim</h3>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p>Are you sure you want to claim this coupon?</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>This will mark the coupon as used and cannot be undone.</p>
            </div>
            <div className="modal-footer verify-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={isClaiming}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleClaim} disabled={isClaiming}>
                {isClaiming ? 'Claiming...' : 'Yes, Claim Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header verify-page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Verify Gift Coupon</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Enter a coupon code to check its validity and status.</p>
      </div>

      <div className="card verify-search-card">
        <form onSubmit={handleVerify} className="verify-form">
          <label className="sr-only" htmlFor="verifyCouponCode">Coupon code</label>
          <input
            type="text"
            id="verifyCouponCode"
            className="verify-input verify-code-input form-input"
            value={code}
            onChange={handleInputChange}
            placeholder="Enter Coupon Code (e.g., AKS-1234)"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-lg verify-submit"
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? 'VERIFYING...' : 'VERIFY COUPON'}
          </button>
        </form>
      </div>

      {isLoading && (
        <div role="status" style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div className="loading-spinner" />
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Checking...</span>
        </div>
      )}

      {error && !isLoading && (
        <div role="alert" className="empty-state" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 style={{ color: '#b91c1c' }}>{error}</h3>
        </div>
      )}

      {coupon && !isLoading && (
        <div className="card result-card verify-result-card" style={{ padding: '2rem', borderTop: '4px solid #d4af37' }}>
          {(() => {
            const status = computeDisplayStatus(coupon);
            return (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '0.5rem' }}>
                    {getStatusEmoji(status)}
                  </div>
                  <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '1.25rem', padding: '0.5rem 1rem' }}>
                    {status}
                  </span>
                </div>

                <div className="verify-result-grid">
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <p className="stat-label">Customer Name</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{coupon.customer_name}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <p className="stat-label">Coupon Value</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d4af37' }}>{formatCurrency(coupon.value)}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <p className="stat-label">Valid From</p>
                    <p style={{ fontWeight: '500' }}>{formatIndianDate(coupon.valid_from)}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <p className="stat-label">Valid Until</p>
                    <p style={{ fontWeight: '500' }}>{formatIndianDate(coupon.valid_until)}</p>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '8px', background: status === 'ACTIVE' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${status === 'ACTIVE' ? '#bbf7d0' : '#e2e8f0'}`, textAlign: 'center' }}>
                  {status === 'ACTIVE' && (
                    <>
                      <p style={{ color: '#166534', fontWeight: 'bold', marginBottom: '1rem' }}>This coupon is valid and ready to be claimed.</p>
                      <button className="btn btn-primary btn-lg" onClick={() => setModalOpen(true)} style={{ width: '100%', maxWidth: '300px' }}>
                        CLAIM COUPON
                      </button>
                    </>
                  )}
                  {status === 'CLAIMED' && (
                    <div>
                      <p style={{ color: '#166534', fontWeight: 'bold', fontSize: '1.1rem' }}>This coupon is claimed.</p>
                      <p style={{ marginTop: '0.5rem' }}>Claimed on: {coupon.claimed_at ? formatDateTime(coupon.claimed_at) : 'Unknown'}</p>
                    </div>
                  )}
                  {status === 'EXPIRED' && (
                    <div>
                      <p style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '1.1rem' }}>This coupon has expired.</p>
                      <p style={{ marginTop: '0.5rem' }}>Expired on: {formatIndianDate(coupon.valid_until)}</p>
                    </div>
                  )}
                  {status === 'NOT_ACTIVE' && (
                    <div>
                      <p style={{ color: '#b45309', fontWeight: 'bold', fontSize: '1.1rem' }}>This coupon is not yet active.</p>
                      <p style={{ marginTop: '0.5rem' }}>Becomes active on: {formatIndianDate(coupon.valid_from)}</p>
                    </div>
                  )}
                  {status === 'CANCELLED' && (
                    <div>
                      <p style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '1.1rem' }}>This coupon was cancelled.</p>
                      <p style={{ marginTop: '0.5rem' }}>Cancelled on: {coupon.cancelled_at ? formatDateTime(coupon.cancelled_at) : 'Unknown'}</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
