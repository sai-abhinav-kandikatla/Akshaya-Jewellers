'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode } from '@/app/actions/coupons';
import { logAuditEvent } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import { Coupon } from '@/lib/types';

export default function CouponSuccessPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ id: number, message: string, type: string } | null>(null);

  useEffect(() => {
    async function fetchCoupon() {
      try {
        const resolvedParams = await params;
        const code = resolvedParams?.code || (params as any)?.code;
        if (!code) {
          setError('Invalid coupon link');
          setIsLoading(false);
          return;
        }

        const data = await getCouponByCode(code);
        if (data) {
          setCoupon(data);
        } else {
          setError('Coupon not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch coupon');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCoupon();
  }, [params]);

  const handleCopyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.coupon_code);
      setToast({ id: Date.now(), message: 'Copied to clipboard', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleWhatsApp = async () => {
    if (coupon) {
      const verificationUrl = `${window.location.origin}/verify/${coupon.coupon_code}`;
      const url = generateWhatsAppURL(coupon, verificationUrl);
      window.open(url, '_blank');
      void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, {
        phone_number: coupon.phone_number
      }).catch((auditError) => console.error('WhatsApp audit logging failed:', auditError));
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <div className="loading-spinner w-8 h-8 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 font-medium">Generating coupon...</span>
      </div>
    );
  }

  if (error || !coupon) {
    return <div className="empty-state py-12 text-center"><h3>{error || 'Coupon not found'}</h3></div>;
  }

  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${coupon.coupon_code}` 
    : `https://akshaya-jewellers-mncl.vercel.app/verify/${coupon.coupon_code}`;

  const displayStatus = computeDisplayStatus(coupon);
  const canSendWhatsApp = displayStatus === 'ACTIVE' || displayStatus === 'NOT_ACTIVE';
  const whatsappStatus = coupon.whatsapp_status;
  const excelStatus = coupon.excel_sync_status;

  const whatsappLabel = whatsappStatus === 'SENT'
    ? 'Sent via Cloud API'
    : whatsappStatus === 'PREPARED'
      ? 'Ready to send'
      : whatsappStatus === 'FAILED'
        ? 'Send failed'
        : 'Not sent';
  const excelLabel = excelStatus === 'SYNCED'
    ? 'Synced'
    : excelStatus === 'ERROR'
      ? 'Sync failed'
      : excelStatus === 'PENDING'
        ? 'Retry queued'
        : 'Not synced';

  return (
    <div className="coupon-success-page max-w-lg mx-auto space-y-6 pb-8">
      {toast && (
        <div className="toast-container fixed bottom-20 right-4 z-50">
          <div className="toast bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xl">
            ✓ {toast.message}
          </div>
        </div>
      )}

      {/* Success Badge */}
      <div className="text-center pt-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 shadow-sm">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">COUPON CREATED</h1>
        <p className="text-xs text-gray-500 mt-0.5">Akshaya Jewellery Digital Gift Voucher</p>
      </div>

      {/* Status Indicators Cards (Master Prompt Section 16-18) */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 border rounded-xl flex items-center gap-2 ${whatsappStatus === 'SENT' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-base">{whatsappStatus === 'SENT' ? '✓' : '•'}</span>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-800">WhatsApp</p>
            <p className="text-xs font-semibold text-gray-700">{whatsappLabel}</p>
          </div>
        </div>
        <div className={`p-3 border rounded-xl flex items-center gap-2 ${excelStatus === 'SYNCED' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-base">{excelStatus === 'SYNCED' ? '✓' : '•'}</span>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-800">Excel Sync</p>
            <p className="text-xs font-semibold text-gray-700">{excelLabel}</p>
          </div>
        </div>
      </div>

      {canSendWhatsApp && (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-4" aria-label="Send coupon on WhatsApp">
          <button
            onClick={handleWhatsApp}
            className="btn btn-whatsapp btn-lg w-full font-bold shadow-md rounded-xl flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {whatsappStatus === 'SENT' ? 'RESEND ON WHATSAPP' : 'SEND TO WHATSAPP'}
          </button>
          <p className="mt-2 text-center text-xs leading-5 text-green-900">
            {whatsappStatus === 'SENT'
              ? 'The system has sent this coupon. Tap to open WhatsApp and send it again if needed.'
              : 'Opens a pre-filled WhatsApp message. Review it and tap Send in WhatsApp.'}
          </p>
        </section>
      )}

      {/* Main Coupon Card */}
      <div className="coupon-success-card card bg-white p-5 rounded-2xl shadow-md border border-gray-200 space-y-4">
        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Customer</p>
            <p className="text-lg font-bold text-gray-900">{coupon.customer_name}</p>
            <p className="text-xs text-gray-500">{coupon.phone_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Value</p>
            <p className="text-2xl font-bold text-[#b8860b]">{formatCurrency(coupon.value)}</p>
          </div>
        </div>

        <div className="bg-[#fdfbf7] p-4 rounded-xl text-center border border-dashed border-[#d4af37]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Coupon Code</p>
          <h2 className="coupon-success-code text-2xl font-mono font-bold tracking-wider text-gray-900 my-1">{coupon.coupon_code}</h2>
          <span className={`badge badge-${displayStatus.toLowerCase().replace('_', '-')}`}>
            {displayStatus}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-600 pt-1">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase">Valid From</span>
            <span className="font-semibold text-gray-800">{formatIndianDate(coupon.valid_from)}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 block text-[10px] uppercase">Valid Until</span>
            <span className="font-semibold text-gray-800">{formatIndianDate(coupon.valid_until)}</span>
          </div>
        </div>

        {/* Prominent QR Code */}
        <div className="coupon-qr pt-2 text-center">
          <div className="inline-block p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <QRCodeSVG value={verificationUrl} size={150} level="M" />
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Scan for public verification</p>
          </div>
        </div>
      </div>

      {/* Primary Actions (Master Prompt Section 16) */}
      <div className="space-y-3">
        <div className={`grid ${displayStatus === 'CLAIMED' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
          <Link
            href={`/dashboard/coupons/${coupon.coupon_code}`}
            className="btn btn-secondary text-center text-sm py-3 font-semibold rounded-xl"
          >
            VIEW COUPON
          </Link>
          {displayStatus !== 'CLAIMED' && (
            <button
              onClick={handleCopyCode}
              className="btn btn-ghost text-center text-sm py-3 border border-gray-300 rounded-xl"
            >
              COPY CODE
            </button>
          )}
        </div>

        <Link
          href="/dashboard/coupons/create"
          className="btn btn-primary w-full py-3 text-center text-sm font-bold rounded-xl"
        >
          + CREATE ANOTHER
        </Link>
      </div>
    </div>
  );
}
