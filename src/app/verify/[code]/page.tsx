export const dynamic = 'force-dynamic';

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatIndianDate, formatDateTime } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { isUuid } from '@/lib/utils/identifiers';
import { Coupon } from '@/lib/types';
import PublicClaimButton from './PublicClaimButton';

export default async function PublicVerifyPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const code = resolvedParams.code;
  
  const query = supabase
    .from('coupons')
    .select('*');
  const { data: coupon, error } = isUuid(code)
    ? await query.eq('id', code).maybeSingle()
    : await query.eq('coupon_code', code.toUpperCase()).maybeSingle();

  if (error) {
    console.error('Public coupon verification database error:', error);
  }

  if (error || !coupon) {
    return (
      <div className="public-verify-page min-h-screen flex items-center justify-center p-4 bg-[#fdfbf7]">
        <div className="public-verification-error card max-w-sm w-full p-6 text-center bg-white rounded-2xl shadow-xl border border-red-100 space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invalid Coupon</h2>
          <p className="text-xs text-gray-500">
            {error
              ? 'Coupon verification is temporarily unavailable. Please try again.'
              : 'The coupon code you scanned is invalid or does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const status = computeDisplayStatus(coupon as Coupon);

  return (
    <div className="public-verify-page min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
      <div className="public-verification-card card max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 space-y-0">
        
        {/* Official Brand Header */}
        <div className="public-verification-brand bg-[#1a1a1a] p-6 text-center text-[#d4af37] flex flex-col items-center border-b-2 border-[#d4af37]">
          <img src="/logo.png" alt="Akshaya Jewellers Logo" className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-[#D4AF37] shadow-lg" />
          <h1 className="text-xl font-serif font-bold tracking-widest text-[#d4af37] uppercase">AKSHAYA JEWELLERY</h1>
          <p className="text-xs tracking-wider opacity-80 mt-0.5 text-gold-200">COUPON VERIFICATION</p>
        </div>

        {/* Content Body */}
        <div className="public-verification-content p-6 space-y-5">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Coupon Code</p>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 my-1">{coupon.coupon_code}</h2>
          </div>

          <div className="flex justify-between items-center bg-[#fdfbf7] p-4 rounded-2xl border border-dashed border-[#d4af37]">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Customer</p>
              <p className="text-base font-bold text-gray-900">{coupon.customer_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Value</p>
              <p className="text-2xl font-bold text-[#b8860b]">{formatCurrency(coupon.coupon_value || coupon.value)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-600 px-1">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Valid From</span>
              <span className="font-semibold text-gray-800">{formatIndianDate(coupon.valid_from)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block text-[10px] uppercase">Valid Until</span>
              <span className="font-semibold text-gray-800">{formatIndianDate(coupon.valid_until)}</span>
            </div>
          </div>

          {/* Verification Status Display (Master Prompt Section 28-30) */}
          <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <span className={`badge badge-${status.toLowerCase().replace('_', '-')} text-sm py-1 px-4 inline-block`}>
              {status === 'ACTIVE' && '✓ ACTIVE'}
              {status === 'CLAIMED' && '✓ REDEEMED'}
              {status === 'EXPIRED' && 'EXPIRED'}
              {status === 'CANCELLED' && 'CANCELLED'}
              {status === 'NOT_ACTIVE' && 'NOT ACTIVE YET'}
            </span>

            {status === 'CLAIMED' && (
              <div className="space-y-1 text-xs font-semibold text-green-700" role="status">
                <p>✓ This coupon is claimed.</p>
                <p>Claimed on: {coupon.claimed_at ? formatDateTime(coupon.claimed_at) : 'Unknown'}</p>
              </div>
            )}
            {status === 'EXPIRED' && (
              <p className="text-xs font-semibold text-red-700 mt-2">
                This coupon expired on {formatIndianDate(coupon.valid_until)}.
              </p>
            )}
            {status === 'CANCELLED' && (
              <p className="text-xs font-semibold text-gray-700 mt-2">
                This coupon has been cancelled.
              </p>
            )}
            {status === 'NOT_ACTIVE' && (
              <p className="text-xs font-semibold text-amber-700 mt-2">
                This coupon becomes valid on {formatIndianDate(coupon.valid_from)}.
              </p>
            )}
          </div>

          {/* Interactive Claim Button for Active Coupons */}
          {status === 'ACTIVE' && (
            <PublicClaimButton couponCode={coupon.coupon_code} customerName={coupon.customer_name} couponValue={coupon.coupon_value || coupon.value} />
          )}
        </div>

        {/* Official Footer */}
        <div className="bg-gray-100 p-4 text-center text-xs text-gray-600 border-t border-gray-200">
          Please visit <strong>Akshaya Jewellery</strong> store to redeem this coupon.
        </div>
      </div>
    </div>
  );
}
