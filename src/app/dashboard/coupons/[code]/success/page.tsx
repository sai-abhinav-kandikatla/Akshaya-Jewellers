'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode } from '@/app/actions/coupons';
import { logAuditEvent } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL, generateWhatsAppMessage } from '@/lib/utils/whatsapp';
import { Coupon } from '@/lib/types';

export default function CouponSuccessPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ id: number, message: string } | null>(null);

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

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyCode = async () => {
    if (coupon) {
      try {
        await navigator.clipboard.writeText(coupon.coupon_code);
        showToast('✓ Coupon code copied');
      } catch {
        showToast('Unable to copy code');
      }
    }
  };

  const handleWhatsApp = async () => {
    if (!coupon) return;
    const message = generateWhatsAppMessage(coupon);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(coupon.coupon_code)}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${coupon.coupon_code}-QR.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: message,
            title: `Akshaya Jewellery - ${coupon.coupon_code}`,
          });
          void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, {
            phone_number: coupon.phone_number,
            shared_with_file: true
          }).catch(() => {});
          return;
        }
      } catch {
        // Fall back to wa.me URL
      }
    }

    const url = generateWhatsAppURL(coupon);
    window.open(url, '_blank');
    void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, {
      phone_number: coupon.phone_number
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#666666]">Loading coupon…</span>
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border border-[#E7E0CF] my-8 space-y-4">
        <p className="text-sm font-semibold text-[#111111]">{error || 'Coupon not found'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111]"
        >
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${coupon.coupon_code}` 
    : `https://akshaya-jewellers-mncl.vercel.app/verify/${coupon.coupon_code}`;

  const displayStatus = computeDisplayStatus(coupon);
  const canSendWhatsApp = displayStatus === 'ACTIVE' || displayStatus === 'NOT_ACTIVE';

  return (
    <div className="space-y-5 max-w-[430px] mx-auto w-full pb-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111] shadow-lg">
            {toast.message}
          </div>
        </div>
      )}

      {/* Success Badge Header (Section 16) */}
      <div className="text-center pt-2">
        <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] flex items-center justify-center mx-auto mb-3 text-[#A67C00]">
          <svg className="w-7 h-7 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-xl font-serif font-bold text-[#111111]">Coupon Created</h1>
        <p className="text-xs text-[#666666] mt-0.5">Digital Gift Coupon generated successfully</p>
      </div>

      {/* Main Coupon Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-4 text-center">
        <div>
          <p className="font-mono font-bold text-2xl text-[#111111] tracking-wider">
            {coupon.coupon_code}
          </p>
          <p className="text-sm font-semibold text-[#666666] mt-0.5">
            {coupon.customer_name}
          </p>
          <p className="text-2xl font-bold text-[#A67C00] mt-1.5">
            {formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}
          </p>
        </div>

        <div className="pt-2 border-t border-[#F2EDE2] text-xs text-[#666666]">
          <p>Valid: <span className="font-semibold text-[#111111]">{formatIndianDate(coupon.valid_from)} – {formatIndianDate(coupon.valid_until)}</span></p>
        </div>

        {/* WhatsApp Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] text-xs font-medium text-[#111111] mx-auto">
          <span className="text-[#A67C00]">✓</span>
          <span>WhatsApp Ready</span>
        </div>

        {/* QR Code */}
        <div className="pt-2">
          <div className="inline-block p-3 bg-white rounded-xl border border-[#E7E0CF]">
            <QRCodeSVG value={verificationUrl} size={140} level="M" />
          </div>
          <p className="text-[10px] text-[#666666] mt-1.5">Scan to verify voucher</p>
        </div>
      </div>

      {/* Action Buttons (Section 16) */}
      <div className="space-y-2.5">
        {canSendWhatsApp && (
          <button
            onClick={handleWhatsApp}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-white font-bold text-sm shadow-sm hover:brightness-105 active:brightness-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>Resend on WhatsApp</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/dashboard/coupons/${coupon.coupon_code}`}
            className="h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            View Coupon
          </Link>

          <Link
            href="/dashboard/coupons/create"
            className="h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Create Another
          </Link>
        </div>

        <button
          onClick={handleCopyCode}
          className="w-full h-10 rounded-xl text-xs font-semibold text-[#666666] hover:text-[#111111] border border-transparent hover:border-[#E7E0CF] transition-colors"
        >
          Copy Code
        </button>
      </div>
    </div>
  );
}
