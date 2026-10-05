'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode } from '@/app/actions/coupons';
import { logAuditEvent } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import type { Coupon } from '@/lib/types';
import BottomSheet from '@/components/BottomSheet';

export default function CouponSuccessPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmWhatsApp, setConfirmWhatsApp] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { code } = await params;
        const data = await getCouponByCode(code);
        if (active) data ? setCoupon(data) : setError('Coupon not found.');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load coupon.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [params]);

  if (isLoading) return <p className="page-state">Loading coupon…</p>;
  if (!coupon) return <div className="page-state"><p>{error || 'Coupon not found.'}</p><Link href="/dashboard">Back to Home</Link></div>;

  const verificationUrl = typeof window === 'undefined' ? coupon.coupon_code : `${window.location.origin}/verify/${coupon.coupon_code}`;
  const openWhatsApp = () => {
    window.open(generateWhatsAppURL(coupon), '_blank', 'noopener,noreferrer');
    void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, { phone_number: coupon.phone_number }).catch(() => {});
    setConfirmWhatsApp(false);
  };

  return (
    <div className="coupon-success-page">
      <BottomSheet
        isOpen={confirmWhatsApp}
        onClose={() => setConfirmWhatsApp(false)}
        title="Resend WhatsApp"
        description={`Open WhatsApp to send this coupon to +91 ${coupon.phone_number}?`}
        details={{ code: coupon.coupon_code, customerName: coupon.customer_name, value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0) }}
        primaryButtonText="Open WhatsApp"
        primaryButtonAction={openWhatsApp}
        secondaryButtonText="Cancel"
        secondaryButtonAction={() => setConfirmWhatsApp(false)}
      />

      <div className="coupon-success-intro">
        <p className="coupon-success-mark" aria-hidden="true">✓</p>
        <h1>Coupon Created</h1>
        <p>Digital gift coupon is ready.</p>
      </div>

      <section className="coupon-success-summary">
        <p className="coupon-success-code">{coupon.coupon_code}</p>
        <p className="coupon-success-customer">{coupon.customer_name}</p>
        <p className="coupon-success-value">{formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}</p>
        <dl className="coupon-success-dates">
          <div><dt>Valid From</dt><dd>{formatIndianDate(coupon.valid_from)}</dd></div>
          <div><dt>Valid Until</dt><dd>{formatIndianDate(coupon.valid_until)}</dd></div>
        </dl>
        <div className="coupon-success-qr"><QRCodeSVG value={verificationUrl} size={152} level="M" /></div>
        <p className="coupon-success-hint">Scan to verify coupon</p>
      </section>

      <div className="coupon-success-actions">
        <button className="action-primary" onClick={() => setConfirmWhatsApp(true)}>Resend WhatsApp</button>
        <Link className="action-secondary" href={`/dashboard/coupons/${coupon.coupon_code}`}>View Coupon</Link>
        <Link className="action-secondary" href="/dashboard/coupons/create">Create Another</Link>
      </div>
    </div>
  );
}
