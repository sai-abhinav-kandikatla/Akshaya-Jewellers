'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getCouponByCode, claimCoupon } from '@/app/actions/coupons';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import BottomSheet from '@/components/BottomSheet';
import { Coupon } from '@/lib/types';
import QRScanner from '@/components/QRScanner';

export default function VerifyCouponPage() {
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanningQR, setIsScanningQR] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [toast, setToast] = useState<{ id: number, message: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase());
  };

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
    setTimeout(() => setToast(null), 3000);
  };

  const executeVerification = async (searchCode: string) => {
    setIsLoading(true);
    setError('');
    setCoupon(null);

    try {
      const data = await getCouponByCode(searchCode);
      if (data) {
        setCoupon(data);
        setCode(searchCode);
      } else {
        setError('Coupon not found. Please verify the code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    let searchCode = code.trim();
    if (searchCode.match(/^\d+$/) || (!searchCode.startsWith('AKS-') && searchCode.length > 0)) {
      if (!searchCode.startsWith('AKS-')) {
        searchCode = `AKS-${searchCode}`;
      }
    }
    await executeVerification(searchCode);
  };

  const handleScanCode = (scannedText: string) => {
    setIsScanningQR(false);
    if (!scannedText) return;

    let raw = scannedText.trim();
    const urlMatch = raw.match(/\/verify\/([A-Za-z0-9_-]+)/i);
    if (urlMatch) {
      raw = urlMatch[1];
    }
    let searchCode = raw.toUpperCase();
    if (searchCode.match(/^\d+$/) || (!searchCode.startsWith('AKS-') && searchCode.length > 0)) {
      if (!searchCode.startsWith('AKS-')) {
        searchCode = `AKS-${searchCode}`;
      }
    }
    setCode(searchCode);
    executeVerification(searchCode);
  };

  const handleClaim = async () => {
    if (!coupon) return;
    
    setIsClaiming(true);
    try {
      const result = await claimCoupon(coupon.coupon_code);
      if (!result.success) {
        const latest = await getCouponByCode(coupon.coupon_code).catch(() => null);
        if (latest) setCoupon(latest);
        showToast(result.error || result.message || 'Failed to claim coupon.');
        return;
      }

      setCoupon(prev => prev ? {
        ...prev,
        status: 'CLAIMED',
        claimed_at: new Date().toISOString(),
      } : prev);
      showToast('✓ Coupon Claimed');
    } catch (err: any) {
      showToast(err.message || 'Unable to claim coupon.');
    } finally {
      setIsClaiming(false);
      setModalOpen(false);
    }
  };

  const status = coupon ? computeDisplayStatus(coupon) : null;

  return (
    <div className="space-y-4 max-w-[430px] mx-auto w-full pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full bg-white border border-[#E7E0CF] text-xs font-semibold text-[#111111] shadow-lg">
            {toast.message}
          </div>
        </div>
      )}

      {/* Claim Confirmation Bottom Sheet */}
      {coupon && (
        <BottomSheet
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          icon={
            <svg className="w-6 h-6 text-[#A67C00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          title="Claim Coupon"
          description="Are you sure you want to redeem this coupon? This action cannot be undone."
          details={{
            code: coupon.coupon_code,
            customerName: coupon.customer_name,
            value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0),
            date: `Valid until ${formatIndianDate(coupon.valid_until)}`,
          }}
          primaryButtonText="Confirm Claim"
          primaryButtonAction={handleClaim}
          secondaryButtonText="Go Back"
          secondaryButtonAction={() => setModalOpen(false)}
          isLoading={isClaiming}
        />
      )}

      {/* 
        ==================================================
        26. VERIFY SCREEN HEADER
        ==================================================
      */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-[#111111] flex items-center gap-1.5 py-1.5 px-2 rounded-xl hover:bg-white transition-colors"
          aria-label="Back to dashboard"
        >
          <svg className="w-4 h-4 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="text-base font-serif font-bold text-[#111111]">Verify Coupon</span>
        </Link>
      </div>

      {/* Main Search Input Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-4">
        {/* QR Scanner Trigger Button */}
        <button
          type="button"
          onClick={() => setIsScanningQR(true)}
          className="w-full h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-[#A67C00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Scan QR Code with Camera</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="h-px bg-[#E7E0CF] flex-1" />
          <span className="text-[10px] uppercase text-[#666666] font-semibold tracking-wider">or enter coupon code</span>
          <div className="h-px bg-[#E7E0CF] flex-1" />
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            className="w-full h-[52px] px-3.5 rounded-xl border border-[#E7E0CF] bg-white text-center font-mono font-bold text-base text-[#111111] placeholder:text-[#999999] tracking-wider focus:outline-none focus:border-[#C9A227] transition-colors"
            value={code}
            onChange={handleInputChange}
            placeholder="AKS-XXXXXX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full h-13 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-white font-bold text-sm tracking-wider uppercase shadow-sm hover:brightness-105 active:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Verifying…' : 'Verify Coupon'}
          </button>
        </form>
      </div>

      {/* Camera QR Scanner Modal */}
      {isScanningQR && (
        <QRScanner
          onScan={handleScanCode}
          onClose={() => setIsScanningQR(false)}
        />
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 bg-white rounded-2xl border border-[#E7E0CF] text-center space-y-1">
          <p className="text-xs font-semibold text-[#111111]">{error}</p>
          <p className="text-[11px] text-[#666666]">Please check the code and try again.</p>
        </div>
      )}

      {/* 
        ==================================================
        Verified Result Card (Section 26)
        ==================================================
      */}
      {coupon && status && (
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-4">
          <div className="text-center pb-3 border-b border-[#F2EDE2]">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A67C00]">
              ✓ Valid Coupon
            </p>
            <h2 className="text-xl font-mono font-bold text-[#111111] mt-0.5 tracking-tight">
              {coupon.coupon_code}
            </h2>
            <p className="text-xl font-bold text-[#A67C00] mt-1">
              {formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
              <span className="text-[#666666]">Customer</span>
              <span className="font-semibold text-[#111111]">{coupon.customer_name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
              <span className="text-[#666666]">Status</span>
              <span className="font-semibold text-[#111111]">{status.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
              <span className="text-[#666666]">Valid Until</span>
              <span className="font-semibold text-[#111111]">{formatIndianDate(coupon.valid_until)}</span>
            </div>
          </div>

          <div className="pt-2">
            {status === 'ACTIVE' ? (
              <button
                onClick={() => setModalOpen(true)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:brightness-105 active:brightness-95 transition-all"
              >
                Claim / Redeem Coupon
              </button>
            ) : (
              <Link
                href={`/dashboard/coupons/${coupon.coupon_code}`}
                className="w-full h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                View Full Details
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
