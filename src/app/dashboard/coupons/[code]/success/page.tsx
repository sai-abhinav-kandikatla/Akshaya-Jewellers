'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode } from '@/app/actions/coupons';
import { logAuditEvent } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { createCouponQrImageFile, shareCouponQrFileWithText } from '@/lib/utils/whatsapp';
import type { Coupon } from '@/lib/types';
import BottomSheet from '@/components/BottomSheet';

export default function CouponSuccessPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmWhatsApp, setConfirmWhatsApp] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [toast, setToast] = useState('');
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!coupon) return;
    setQrImageFile(null);
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    let active = true;
    void createCouponQrImageFile(svg, coupon)
      .then(file => { if (active) setQrImageFile(file); })
      .catch(() => { if (active) setQrImageFile(null); });
    return () => { active = false; };
  }, [coupon]);

  if (isLoading) return <p className="page-state">Loading coupon…</p>;
  if (!coupon) return <div className="page-state"><p>{error || 'Coupon not found.'}</p><Link href="/dashboard">Back to Home</Link></div>;

  const verificationUrl = typeof window === 'undefined' ? coupon.coupon_code : `${window.location.origin}/verify/${coupon.coupon_code}`;
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  const sendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      if (!qrImageFile) throw new Error('The coupon QR image is still preparing. Try again in a moment.');
      const shareResult = await shareCouponQrFileWithText(qrImageFile, coupon);
      if (shareResult === 'cancelled') return;
      void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, { phone_number: coupon.phone_number }).catch(() => {});
      notify(shareResult === 'shared'
        ? 'QR image and coupon text shared. Choose WhatsApp and the customer to send.'
        : 'QR image downloaded. Attach it in WhatsApp before sending the coupon text.');
    } catch (shareError) {
      notify(shareError instanceof Error ? shareError.message : 'Could not prepare the coupon QR image and text.');
    } finally {
      setIsSendingWhatsApp(false);
      setConfirmWhatsApp(false);
    }
  };

  return (
    <div className="coupon-success-page">
      {toast && <div className="app-toast" role="status">{toast}</div>}
      <BottomSheet
        isOpen={confirmWhatsApp}
        onClose={() => setConfirmWhatsApp(false)}
        title="Resend WhatsApp"
        description={`Send this coupon's QR image and text to +91 ${coupon.phone_number}?`}
        details={{ code: coupon.coupon_code, customerName: coupon.customer_name, value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0) }}
        primaryButtonText="Send Coupon"
        primaryButtonAction={sendWhatsApp}
        secondaryButtonText="Cancel"
        secondaryButtonAction={() => setConfirmWhatsApp(false)}
        isLoading={isSendingWhatsApp}
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
        <div ref={qrRef} className="coupon-success-qr">
          <QRCodeSVG value={verificationUrl} size={152} level="M" />
          <p className="coupon-qr-unique-id">{coupon.coupon_code}</p>
        </div>
        <p className="coupon-success-hint">Scan QR or use unique ID {coupon.coupon_code} to verify</p>
      </section>

      <div className="coupon-success-actions">
        <button className="action-primary" onClick={() => setConfirmWhatsApp(true)}>Resend WhatsApp</button>
        <Link className="action-secondary" href={`/dashboard/coupons/${coupon.coupon_code}`}>View Coupon</Link>
        <Link className="action-secondary" href="/dashboard/coupons/create">Create Another</Link>
      </div>
    </div>
  );
}
