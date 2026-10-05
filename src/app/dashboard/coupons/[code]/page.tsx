'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode, claimCoupon, cancelCoupon } from '@/app/actions/coupons';
import { getCampaignById } from '@/app/actions/campaigns';
import { getCouponAuditHistory } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate, formatDateTime } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import { Coupon, AuditEvent } from '@/lib/types';

export default function CouponDetailPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditEvent[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalState, setModalState] = useState<{ isOpen: boolean, type: 'CLAIM' | 'CANCEL' | null }>({ isOpen: false, type: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ id: number, message: string, type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const resolvedParams = await params;
      const code = resolvedParams?.code || (params as any)?.code;
      if (!code) {
        setError('Invalid coupon code link');
        setIsLoading(false);
        return;
      }

      const data = await getCouponByCode(code);
      if (data) {
        setCoupon(data);
        if (data.campaign_id) {
          const campaign = await getCampaignById(data.campaign_id);
          setCampaignName(campaign?.name || null);
        } else {
          setCampaignName(null);
        }
        const history = await getCouponAuditHistory(data.id);
        setAuditHistory(history);
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
    loadData();
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
        const res = await claimCoupon(coupon.id);
        if (res.success) {
          showToast(res.message || '✓ Coupon redeemed successfully!', 'success');
        } else {
          showToast(res.error || 'Failed to redeem coupon', 'error');
        }
      } else if (modalState.type === 'CANCEL') {
        const res = await cancelCoupon(coupon.id);
        if (res.success) {
          showToast(res.message || 'Coupon cancelled', 'success');
        } else {
          showToast(res.error || 'Failed to cancel coupon', 'error');
        }
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
      showToast('Copied to clipboard', 'success');
    }
  };

  const handleWhatsApp = () => {
    if (coupon) {
      const url = generateWhatsAppURL(coupon, `${window.location.origin}/verify/${coupon.coupon_code}`);
      window.open(url, '_blank');
    }
  };

  if (isLoading) return (
    <div className="py-16 text-center flex flex-col items-center gap-3">
      <div className="loading-spinner w-8 h-8 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500 font-medium">Loading details...</span>
    </div>
  );

  if (error || !coupon) return (
    <div className="empty-state py-12 text-center space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{error || 'Coupon not found'}</h2>
      <button onClick={() => router.push('/dashboard/coupons')} className="btn btn-secondary text-sm">
        ← Go Back
      </button>
    </div>
  );

  const status = computeDisplayStatus(coupon);
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${coupon.coupon_code}` : '';

  return (
    <div className="coupon-detail-page max-w-xl mx-auto space-y-6 pb-8">
      {toast && (
        <div className="toast-container fixed bottom-20 right-4 z-50">
          <div className={`toast px-4 py-2 rounded-xl text-xs font-semibold shadow-xl text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Confirmation Bottom Sheet / Modal (Master Prompt Section 25) */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-slideUp">
            <div className="text-center">
            <h3 className={`text-xl font-bold ${modalState.type === 'CANCEL' ? 'text-red-600' : 'text-gray-900'}`}>
                {modalState.type === 'CLAIM' ? 'Redeem Coupon?' : 'Cancel this coupon?'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm space-y-1">
              <p><span className="text-gray-500">Customer:</span> <strong>{coupon.customer_name}</strong></p>
              <p><span className="text-gray-500">Coupon:</span> <strong>{coupon.coupon_code}</strong></p>
              <p><span className="text-gray-500">Value:</span> <strong className="text-[#b8860b]">{formatCurrency(coupon.value)}</strong></p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                className={`btn btn-lg w-full font-bold ${modalState.type === 'CLAIM' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleAction}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : modalState.type === 'CLAIM' ? 'CONFIRM REDEMPTION' : 'YES, CANCEL COUPON'}
              </button>
              <button
                className="btn btn-ghost w-full py-3 text-sm text-gray-600 font-semibold"
                onClick={() => setModalState({ isOpen: false, type: null })}
                disabled={isProcessing}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium py-1 px-2 rounded-lg hover:bg-gray-100"
        >
          ← Back
        </button>
        <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`}>
          {status}
        </span>
      </div>

      {/* Main Info Card */}
      <div className="coupon-detail-card card bg-white p-5 rounded-2xl shadow-md border border-gray-200 space-y-4">
        <div className="text-center border-b border-gray-100 pb-4">
          <p className="text-xs text-gray-400 uppercase font-semibold">Coupon Code</p>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 my-1">{coupon.coupon_code}</h1>
          <p className="text-2xl font-bold text-[#b8860b] mt-1">{formatCurrency(coupon.value)}</p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Customer Name</span>
            <span className="font-bold text-gray-900">{coupon.customer_name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Phone Number</span>
            <span className="font-semibold text-gray-800">{coupon.phone_number}</span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Validity Period</span>
            <span className="font-semibold text-gray-800">{formatIndianDate(coupon.valid_from)} – {formatIndianDate(coupon.valid_until)}</span>
          </div>
          {campaignName && (
            <div className="md:hidden flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Campaign</span>
              <span className="font-semibold text-gray-800 text-right">{campaignName}</span>
            </div>
          )}

          {status === 'CLAIMED' && (
            <div className="md:hidden p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium text-center">
              <span className="block text-2xl mb-1" aria-hidden="true">✓</span>
              <strong className="block text-base">COUPON REDEEMED</strong>
              <span className="block mt-1">{coupon.coupon_code} · {formatCurrency(coupon.value)}</span>
              <span className="block text-xs mt-1">Claimed {coupon.claimed_at ? formatDateTime(coupon.claimed_at) : ''}</span>
              <span className="block text-xs mt-2">Excel {coupon.excel_sync_status === 'SYNCED' ? '✓ Updated' : coupon.excel_sync_status === 'ERROR' ? '⚠ Update failed' : '⏳ Update pending'}</span>
            </div>
          )}

          {status === 'CLAIMED' && (
            <div className="hidden-mobile p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-medium">
              ✓ Redeemed on {coupon.claimed_at ? formatDateTime(coupon.claimed_at) : ''}
            </div>
          )}

          {status === 'EXPIRED' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
              ⏰ Expired on {formatIndianDate(coupon.valid_until)}
            </div>
          )}

          {status === 'CANCELLED' && (
            <div className="p-3 bg-gray-100 border border-gray-300 rounded-xl text-xs text-gray-700 font-medium">
              ❌ Coupon has been cancelled.
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="coupon-qr text-center pt-2">
          <div className="inline-block p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            {verificationUrl && <QRCodeSVG value={verificationUrl} size={150} level="M" />}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Scan for public verification</p>
        </div>
      </div>

      {/* Action Buttons (Master Prompt Section 24) */}
      <div className="space-y-3">
        {status === 'ACTIVE' && (
          <button
            onClick={() => setModalState({ isOpen: true, type: 'CLAIM' })}
            className="coupon-action-primary btn btn-primary btn-lg w-full font-bold shadow-md rounded-xl"
          >
            CLAIM / REDEEM COUPON
          </button>
        )}

        {status !== 'CLAIMED' && (
          <>
            <button
              onClick={handleWhatsApp}
              className="btn btn-whatsapp btn-lg w-full font-bold shadow-md rounded-xl flex items-center justify-center gap-2"
            >
              RESEND ON WHATSAPP
            </button>

            <button
              onClick={handleCopyCode}
              className="btn btn-ghost w-full py-3 border border-gray-300 rounded-xl text-sm font-semibold"
            >
              COPY CODE
            </button>
          </>
        )}

        {/* Visually Separated Cancel Action */}
        {(status === 'ACTIVE' || status === 'NOT_ACTIVE') && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setModalState({ isOpen: true, type: 'CANCEL' })}
              className="btn btn-danger w-full py-3 text-sm font-bold rounded-xl opacity-90 hover:opacity-100"
            >
              CANCEL COUPON
            </button>
          </div>
        )}
      </div>

      {/* Audit History Timeline (Master Prompt Section 33) */}
      <div className="card bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Audit History Timeline</h3>
        {auditHistory.length === 0 ? (
          <p className="text-xs text-gray-400">No history logged yet.</p>
        ) : (
          <div className="space-y-3 pl-2 border-l-2 border-gold-300 ml-2">
            {auditHistory.map((audit, idx) => (
              <div key={audit.id || idx} className="relative pl-4 text-xs">
                <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                <p className="font-bold text-gray-800">{audit.action.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-gray-400">{formatDateTime(audit.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
