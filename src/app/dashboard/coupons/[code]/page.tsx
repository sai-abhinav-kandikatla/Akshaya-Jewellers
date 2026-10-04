'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode, claimCoupon, cancelCoupon } from '@/app/actions/coupons';
import { getCampaigns } from '@/app/actions/campaigns';
import { getCouponAuditHistory } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate, formatDateTime } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import { Coupon, AuditEvent, Campaign } from '@/lib/types';

export default function CouponDetailPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditEvent[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalState, setModalState] = useState<{ isOpen: boolean, type: 'CLAIM' | 'CANCEL' | null }>({ isOpen: false, type: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ id: number, message: string, type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getCouponByCode(params.code);
      if (data) {
        setCoupon(data);
        const history = await getCouponAuditHistory(data.id);
        setAuditHistory(history);
        
        if (data.campaign_id) {
          const campaigns = await getCampaigns();
          const found = campaigns.find(c => c.id === data.campaign_id);
          if (found) setCampaign(found);
        }
      } else {
        setError('Coupon not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params && params.code) {
      loadData();
    }
  }, [params]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async () => {
    if (!coupon || !modalState.type) return;
    
    setIsProcessing(true);
    try {
      if (modalState.type === 'CLAIM') {
        await claimCoupon(coupon.id);
        showToast('Coupon claimed successfully!', 'success');
      } else if (modalState.type === 'CANCEL') {
        await cancelCoupon(coupon.id);
        showToast('Coupon cancelled successfully!', 'success');
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || `Failed to ${modalState.type.toLowerCase()} coupon`, 'error');
    } finally {
      setIsProcessing(false);
      setModalState({ isOpen: false, type: null });
    }
  };

  const handleCopyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.coupon_code);
      showToast('Coupon code copied!', 'success');
    }
  };

  const handleWhatsApp = () => {
    if (coupon) {
      const url = generateWhatsAppURL(coupon, `${window.location.origin}/verify/${coupon.coupon_code}`);
      window.open(url, '_blank');
    }
  };

  if (isLoading) return <div className="loading-spinner" style={{ textAlign: 'center', padding: '3rem' }}>Loading details...</div>;
  if (error || !coupon) return <div className="empty-state"><h2>{error || 'Coupon not found'}</h2><button onClick={() => router.push('/dashboard/coupons')} className="btn btn-secondary mt-4">Go Back</button></div>;

  const status = computeDisplayStatus(coupon);
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${coupon.coupon_code}` : '';

  return (
    <div className="dashboard-layout coupon-detail-page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalState.isOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal card" style={{ maxWidth: '400px', width: '100%', background: '#fff', borderRadius: '8px', padding: '1.5rem' }}>
            <div className="modal-header">
              <h3 style={{ marginBottom: '1rem', color: modalState.type === 'CANCEL' ? '#dc2626' : '#166534' }}>
                Confirm {modalState.type === 'CLAIM' ? 'Claim' : 'Cancellation'}
              </h3>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p>Are you sure you want to {modalState.type === 'CLAIM' ? 'claim' : 'cancel'} this coupon?</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setModalState({ isOpen: false, type: null })} disabled={isProcessing}>
                Cancel
              </button>
              <button className={`btn ${modalState.type === 'CLAIM' ? 'btn-primary' : 'btn-danger'}`} onClick={handleAction} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : `Yes, ${modalState.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon" style={{ padding: '0.5rem' }} aria-label="Go back">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 style={{ margin: 0 }}>Coupon Details</h1>
        </div>
        <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          {status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Details & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card coupon-detail">
            <div className="card-body">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <p className="text-muted" style={{ marginBottom: '0.25rem' }}>Coupon Value</p>
                <h2 style={{ fontSize: '2.5rem', color: '#d4af37', margin: 0 }}>{formatCurrency(coupon.value)}</h2>
                <h3 style={{ fontSize: '1.5rem', letterSpacing: '2px', marginTop: '0.5rem', color: '#111827' }}>{coupon.coupon_code}</h3>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <p className="stat-label">Customer Name</p>
                  <p style={{ fontWeight: '500', fontSize: '1.1rem' }}>{coupon.customer_name}</p>
                </div>
                <div>
                  <p className="stat-label">Phone Number</p>
                  <p style={{ fontWeight: '500' }}>{coupon.phone_number}</p>
                </div>
                {campaign && (
                  <div>
                    <p className="stat-label">Campaign</p>
                    <p>{campaign.name}</p>
                  </div>
                )}
                <div>
                  <p className="stat-label">Validity Period</p>
                  <p>{formatIndianDate(coupon.valid_from)} &mdash; {formatIndianDate(coupon.valid_until)}</p>
                </div>
                
                {status === 'CLAIMED' && coupon.claimed_at && (
                  <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    <p className="stat-label" style={{ color: '#166534' }}>Claimed Details</p>
                    <p style={{ color: '#15803d' }}>Date: {formatDateTime(coupon.claimed_at)}</p>
                    {coupon.claimed_by && <p style={{ color: '#15803d' }}>By Admin ID: {coupon.claimed_by}</p>}
                  </div>
                )}

                {status === 'CANCELLED' && coupon.cancelled_at && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }}>
                    <p className="stat-label" style={{ color: '#991b1b' }}>Cancellation Details</p>
                    <p style={{ color: '#b91c1c' }}>Date: {formatDateTime(coupon.cancelled_at)}</p>
                    {coupon.cancelled_by && <p style={{ color: '#b91c1c' }}>By Admin ID: {coupon.cancelled_by}</p>}
                  </div>
                )}

                <div>
                  <p className="stat-label">Created At</p>
                  <p style={{ fontSize: '0.875rem' }}>{formatDateTime(coupon.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {status === 'ACTIVE' && (
                <button className="btn btn-primary btn-lg" onClick={() => setModalState({ isOpen: true, type: 'CLAIM' })}>
                  CLAIM COUPON
                </button>
              )}
              
              <button className="btn btn-whatsapp" onClick={handleWhatsApp}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                SEND ON WHATSAPP
              </button>
              
              <button className="btn btn-ghost" onClick={handleCopyCode}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                COPY CODE
              </button>

              {(status === 'ACTIVE' || status === 'NOT_ACTIVE') && (
                <button className="btn btn-danger" onClick={() => setModalState({ isOpen: true, type: 'CANCEL' })} style={{ marginTop: '0.5rem' }}>
                  CANCEL COUPON
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: QR Code & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Verification QR</h3>
            <div style={{ background: '#fff', display: 'inline-block', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              {verificationUrl && <QRCodeSVG value={verificationUrl} size={180} level="M" />}
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>Scan to view public verification page</p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Audit Timeline</h3>
            {auditHistory.length === 0 ? (
              <p className="text-muted">No history available.</p>
            ) : (
              <div className="timeline" style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e5e7eb' }}>
                {auditHistory.map((audit, idx) => (
                  <div key={audit.id || idx} className="timeline-item" style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'absolute', left: '-1.85rem', top: '0.25rem', width: '12px', height: '12px', borderRadius: '50%', background: '#d4af37', border: '2px solid #fff' }}></div>
                    <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '6px' }}>
                      <p style={{ fontWeight: '500', margin: 0, fontSize: '0.95rem' }}>{audit.action.replace('_', ' ')}</p>
                      {audit.description && <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0.25rem 0' }}>{audit.description}</p>}
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>{formatDateTime(audit.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
