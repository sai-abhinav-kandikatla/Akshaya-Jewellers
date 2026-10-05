'use client';

import React, { useState } from 'react';
import { getCouponByCode, claimCoupon } from '@/app/actions/coupons';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import BottomSheet from '@/components/BottomSheet';
import type { Coupon } from '@/lib/types';
import QRScanner from '@/components/QRScanner';

export default function VerifyCouponPage() {
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [confirmClaim, setConfirmClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const normalizeCode = (value: string) => {
    const normalized = value.trim().toUpperCase();
    return normalized && !normalized.startsWith('AKS-') ? `AKS-${normalized}` : normalized;
  };

  const executeVerification = async (value: string) => {
    const normalized = normalizeCode(value);
    if (!normalized) return;
    setIsLoading(true);
    setError('');
    setCoupon(null);
    setCode(normalized);
    try {
      const data = await getCouponByCode(normalized);
      if (data) setCoupon(data);
      else setError('Coupon not found. Check the code and try again.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Coupon verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    void executeVerification(code);
  };

  const handleScanCode = (scannedText: string) => {
    setIsScanningQR(false);
    const urlMatch = scannedText.trim().match(/\/verify\/([A-Za-z0-9_-]+)/i);
    void executeVerification(urlMatch ? urlMatch[1] : scannedText);
  };

  const handleClaim = async () => {
    if (!coupon) return;
    setIsClaiming(true);
    try {
      const result = await claimCoupon(coupon.coupon_code);
      if (!result.success) {
        setError(result.error || result.message || 'Could not claim coupon.');
        return;
      }
      setCoupon(current => current ? { ...current, status: 'CLAIMED', claimed_at: new Date().toISOString() } : current);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Could not claim coupon.');
    } finally {
      setIsClaiming(false);
      setConfirmClaim(false);
    }
  };

  const status = coupon ? computeDisplayStatus(coupon) : null;

  return (
    <div className="verify-page">
      {coupon && (
        <BottomSheet
          isOpen={confirmClaim}
          onClose={() => setConfirmClaim(false)}
          title="Claim Coupon"
          description="Are you sure you want to claim this coupon?"
          details={{ code: coupon.coupon_code, customerName: coupon.customer_name, value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0) }}
          primaryButtonText="Yes, Claim"
          primaryButtonAction={handleClaim}
          secondaryButtonText="Go Back"
          secondaryButtonAction={() => setConfirmClaim(false)}
          isLoading={isClaiming}
        />
      )}

      {isScanningQR && <QRScanner onScan={handleScanCode} onClose={() => setIsScanningQR(false)} />}

      <div className="page-heading"><h1>Verify Coupon</h1></div>
      <div className="verify-options">
        <button className="action-secondary" type="button" onClick={() => setIsScanningQR(true)}>Scan QR Code</button>
        <p className="verify-or">or enter coupon code</p>
        <form onSubmit={handleVerify} className="verify-form">
          <input
            value={code}
            onChange={event => setCode(event.target.value.toUpperCase())}
            placeholder="AKS-XXXXXX"
            aria-label="Coupon code"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="action-primary" type="submit" disabled={isLoading || !code.trim()}>
            {isLoading ? 'Verifying…' : 'Verify Coupon'}
          </button>
        </form>
      </div>

      {error && !isLoading && <p className="verify-message" role="status">{error}</p>}

      {coupon && status && (
        <section className="verify-result" aria-label="Coupon verification result">
          <p className="verify-result-status">{status.replace('_', ' ')}</p>
          <h2>{coupon.coupon_code}</h2>
          <dl>
            <div><dt>Customer</dt><dd>{coupon.customer_name}</dd></div>
            <div><dt>Value</dt><dd>{formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}</dd></div>
            <div><dt>Valid Until</dt><dd>{formatIndianDate(coupon.valid_until)}</dd></div>
          </dl>
          {status === 'ACTIVE' && <button className="action-primary" type="button" onClick={() => setConfirmClaim(true)}>Claim Coupon</button>}
        </section>
      )}
    </div>
  );
}
