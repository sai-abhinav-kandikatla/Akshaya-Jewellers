'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { claimCoupon } from '@/app/actions/coupons';
import { formatCurrency } from '@/lib/utils/formatters';

interface PublicClaimButtonProps {
  couponCode: string;
  customerName: string;
  couponValue: number;
}

export default function PublicClaimButton({ couponCode, customerName, couponValue }: PublicClaimButtonProps) {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimedSuccess, setClaimedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [syncWarning, setSyncWarning] = useState('');

  async function handleClaim() {
    setIsClaiming(true);
    setErrorMessage(null);
    try {
      const res = await claimCoupon(couponCode);
      if (res.success) {
        setClaimedSuccess(true);
        setSuccessMessage(res.message || 'Coupon redeemed successfully.');
        setSyncWarning(res.warning || '');
        setShowConfirmModal(false);
        router.refresh();
      } else {
        const message = typeof res.error === 'string' ? res.error : 'Failed to claim coupon';
        if (/already (?:been )?(?:claimed|redeemed)/i.test(message)) {
          setClaimedSuccess(true);
          setSuccessMessage(message);
          setShowConfirmModal(false);
          router.refresh();
        } else {
          setErrorMessage(message);
        }
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'An unexpected error occurred');
    } finally {
      setIsClaiming(false);
    }
  }

  if (claimedSuccess) {
    return (
      <div className="space-y-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-green-900" role="status" aria-live="polite">
        <p className="font-bold">✓ {successMessage || 'Coupon redeemed successfully.'}</p>
        {syncWarning && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs font-medium text-amber-900" role="alert">
            The coupon is claimed. Excel needs attention: {syncWarning}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        className="public-claim-button btn btn-primary w-full py-4 text-lg font-bold shadow-lg tracking-wide rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:opacity-90 transition-opacity"
      >
        CLAIM COUPON
      </button>

      {showConfirmModal && (
        <div className="public-claim-backdrop fixed inset-0 z-50 bg-black/60 flex items-end justify-center sm:items-center p-0 sm:p-4 backdrop-blur-xs">
          <div className="public-claim-sheet bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-200 border border-gray-100 shadow-2xl">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Redeem this coupon?</h3>
              <p className="text-xs text-gray-500">This action cannot be undone.</p>
            </div>

            <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#d4af37]/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-bold text-gray-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Value</span>
                <span className="font-bold text-[#b8860b]">{formatCurrency(couponValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coupon Code</span>
                <span className="font-mono font-bold text-gray-900">{couponCode}</span>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" aria-live="assertive" className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 text-center">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={isClaiming}
                onClick={handleClaim}
                className="btn btn-primary w-full py-4 text-base font-bold bg-[#2E7D32] hover:bg-[#1b4d1e] text-white rounded-2xl shadow-md disabled:opacity-50"
              >
                {isClaiming ? 'REDEEMING...' : 'CONFIRM REDEMPTION'}
              </button>
              <button
                type="button"
                disabled={isClaiming}
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary w-full py-3 text-sm font-semibold border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
