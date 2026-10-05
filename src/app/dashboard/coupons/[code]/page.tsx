'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode, claimCoupon, cancelCoupon } from '@/app/actions/coupons';
import { getCampaignById } from '@/app/actions/campaigns';
import { getCouponAuditHistory } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate, formatDateTime } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import BottomSheet from '@/components/BottomSheet';
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
        const [campaign, history] = await Promise.all([
          data.campaign_id ? getCampaignById(data.campaign_id) : Promise.resolve(null),
          getCouponAuditHistory(data.id),
        ]);
        setCampaignName(campaign?.name || null);
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
    const actionType = modalState.type;
    setIsProcessing(true);
    try {
      const result = actionType === 'CLAIM'
        ? await claimCoupon(coupon.coupon_code)
        : await cancelCoupon(coupon.id);

      if (result.success) {
        const changedAt = new Date().toISOString();
        setCoupon(prev => prev ? {
          ...prev,
          status: actionType === 'CLAIM' ? 'CLAIMED' : 'CANCELLED',
          ...(actionType === 'CLAIM' ? { claimed_at: changedAt } : { cancelled_at: changedAt }),
        } : prev);
        showToast(actionType === 'CLAIM' ? '✓ Coupon Claimed' : '✓ Coupon Cancelled', 'success');
        void getCouponAuditHistory(coupon.id).then(setAuditHistory).catch(() => {});
      } else {
        showToast(result.error || `Unable to ${actionType.toLowerCase()} coupon.`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setIsProcessing(false);
      setModalState({ isOpen: false, type: null });
    }
  };

  const handleWhatsApp = () => {
    if (!coupon) return;
    const url = generateWhatsAppURL(coupon);
    window.open(url, '_blank');
    showToast('✓ WhatsApp link opened', 'success');
  };

  const handleCopyCode = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.coupon_code);
      showToast('✓ Coupon code copied', 'success');
    } catch {
      showToast('Unable to copy code', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#666666]">Loading coupon details…</span>
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border border-[#E7E0CF] my-8 space-y-4">
        <p className="text-sm font-semibold text-[#111111]">{error || 'Coupon not found'}</p>
        <Link
          href="/dashboard/coupons"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111]"
        >
          ← Back to Coupons
        </Link>
      </div>
    );
  }

  const status = computeDisplayStatus(coupon);
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${coupon.coupon_code}` : '';

  // Status badge styling strictly matching Master Prompt Section 2
  let badgeClass = 'bg-[#FAF8F2] text-[#111111] border border-[#E7E0CF]';
  if (status === 'ACTIVE' || status === 'NOT_ACTIVE') {
    badgeClass = 'bg-[#FDF8E7] text-[#A67C00] border border-[#C9A227]';
  } else if (status === 'EXPIRED' || status === 'CANCELLED') {
    badgeClass = 'bg-[#F5F5F5] text-[#666666] border border-[#E5E5E5]';
  }

  return (
    <div className="space-y-4 max-w-[430px] mx-auto w-full pb-8">
      {/* Minimal Toast (Master Prompt Section 23) */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111] shadow-lg">
            {toast.message}
          </div>
        </div>
      )}

      {/* 
        ==================================================
        19-21. MOBILE BOTTOM SHEET CONFIRMATIONS
        ==================================================
      */}
      <BottomSheet
        isOpen={modalState.isOpen && modalState.type === 'CANCEL'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        icon={
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        }
        title="Cancel Coupon"
        description="Are you sure you want to cancel this coupon? This action cannot be undone and the coupon will no longer be valid."
        details={{
          code: coupon.coupon_code,
          customerName: coupon.customer_name,
          value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0),
          date: formatIndianDate(coupon.created_at || coupon.valid_from),
        }}
        primaryButtonText="Yes, Cancel"
        primaryButtonAction={handleAction}
        secondaryButtonText="Cancel"
        secondaryButtonAction={() => setModalState({ isOpen: false, type: null })}
        isLoading={isProcessing}
      />

      <BottomSheet
        isOpen={modalState.isOpen && modalState.type === 'CLAIM'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        icon={
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
        title="Claim Coupon"
        description="Are you sure you want to redeem this coupon? Once claimed, it cannot be reused."
        details={{
          code: coupon.coupon_code,
          customerName: coupon.customer_name,
          value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0),
          date: `Valid until ${formatIndianDate(coupon.valid_until)}`,
        }}
        primaryButtonText="Confirm Claim"
        primaryButtonAction={handleAction}
        secondaryButtonText="Go Back"
        secondaryButtonAction={() => setModalState({ isOpen: false, type: null })}
        isLoading={isProcessing}
      />

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.back()}
          className="text-xs font-semibold text-[#111111] flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Coupon Details</span>
        </button>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Details Card (Section 18) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-4">
        <div className="text-center pb-3 border-b border-[#F2EDE2]">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider font-semibold">Coupon Code</p>
          <h1 className="text-2xl font-mono font-bold text-[#111111] mt-0.5 tracking-tight">
            {coupon.coupon_code}
          </h1>
          <p className="text-xl font-bold text-[#A67C00] mt-1">
            {formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
            <span className="text-[#666666]">Customer Name</span>
            <span className="font-semibold text-[#111111]">{coupon.customer_name}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
            <span className="text-[#666666]">Phone Number</span>
            <span className="font-semibold text-[#111111]">{coupon.phone_number}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
            <span className="text-[#666666]">Valid From</span>
            <span className="font-semibold text-[#111111]">{formatIndianDate(coupon.valid_from)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
            <span className="text-[#666666]">Valid Until</span>
            <span className="font-semibold text-[#111111]">{formatIndianDate(coupon.valid_until)}</span>
          </div>

          {campaignName && (
            <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
              <span className="text-[#666666]">Campaign</span>
              <span className="font-semibold text-[#111111]">{campaignName}</span>
            </div>
          )}

          {coupon.claimed_at && (
            <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
              <span className="text-[#666666]">Redeemed On</span>
              <span className="font-semibold text-[#111111]">{formatDateTime(coupon.claimed_at)}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="text-center pt-2">
          <div className="inline-block p-3 bg-white rounded-xl border border-[#E7E0CF]">
            {verificationUrl && <QRCodeSVG value={verificationUrl} size={130} level="M" />}
          </div>
          <p className="text-[10px] text-[#666666] mt-1.5">Scan to verify authenticity</p>
        </div>
      </div>

      {/* 
        ==================================================
        Actions (Section 18)
        Only show actions valid for current status
        ==================================================
      */}
      <div className="space-y-2.5 pt-1">
        {status === 'ACTIVE' && (
          <button
            onClick={() => setModalState({ isOpen: true, type: 'CLAIM' })}
            className="w-full h-13 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-white font-bold text-sm shadow-sm hover:brightness-105 active:brightness-95 transition-all"
          >
            Claim Coupon
          </button>
        )}

        {(status === 'ACTIVE' || status === 'NOT_ACTIVE') && (
          <>
            <button
              onClick={handleWhatsApp}
              className="w-full h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#A67C00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Resend on WhatsApp</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="w-full h-11 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Copy Code
            </button>

            <div className="pt-2">
              <button
                onClick={() => setModalState({ isOpen: true, type: 'CANCEL' })}
                className="w-full h-10 rounded-xl text-xs font-semibold text-[#666666] hover:text-[#111111] border border-transparent hover:border-[#E7E0CF] transition-colors"
              >
                Cancel Coupon
              </button>
            </div>
          </>
        )}
      </div>

      {/* Audit History Timeline (Clean Minimal Style) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-3">
        <h3 className="text-xs font-serif font-bold text-[#111111]">Activity Timeline</h3>
        {auditHistory.length === 0 ? (
          <p className="text-[11px] text-[#666666]">No events recorded.</p>
        ) : (
          <div className="space-y-2.5 pl-2 border-l border-[#E7E0CF] ml-1">
            {auditHistory.map((audit, idx) => (
              <div key={audit.id || idx} className="relative pl-3 text-xs">
                <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#C9A227]" />
                <p className="font-semibold text-[#111111]">{audit.action.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-[#666666]">{formatDateTime(audit.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
