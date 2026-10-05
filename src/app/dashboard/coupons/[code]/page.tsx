'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode, claimCoupon, cancelCoupon } from '@/app/actions/coupons';
import { logAuditEvent } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { createCouponQrImageFile, shareCouponQrImageFile, redirectToWhatsAppDirect } from '@/lib/utils/whatsapp';
import BottomSheet from '@/components/BottomSheet';
import type { Coupon } from '@/lib/types';

type SheetAction = 'CLAIM' | 'CANCEL' | 'WHATSAPP' | null;

export default function CouponDetailPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetAction, setSheetAction] = useState<SheetAction>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState('');
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { code } = await params;
        const data = await getCouponByCode(code);
        if (!active) return;
        if (!data) {
          setError('Coupon not found.');
          return;
        }
        setCoupon(data);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load coupon details.');
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

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const handleShareQrImage = async () => {
    if (!coupon) return;
    setIsProcessing(true);
    try {
      if (!qrImageFile) throw new Error('The coupon QR image is still preparing. Try again in a moment.');
      const result = await shareCouponQrImageFile(qrImageFile, coupon);
      if (result === 'cancelled') return;
      void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, { phone_number: coupon.phone_number }).catch(() => {});
      notify('QR image and coupon text ready in WhatsApp.');
    } catch (shareError) {
      notify(shareError instanceof Error ? shareError.message : 'Could not share the coupon QR image.');
    } finally {
      setIsProcessing(false);
      setSheetAction(null);
    }
  };

  const handleDirectChat = async () => {
    if (!coupon) return;
    setIsProcessing(true);
    try {
      void logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, { phone_number: coupon.phone_number }).catch(() => {});
      await redirectToWhatsAppDirect(coupon, qrImageFile);
      notify('QR image copied to clipboard! Opening direct WhatsApp chat…');
    } catch (shareError) {
      notify(shareError instanceof Error ? shareError.message : 'Could not open WhatsApp.');
    } finally {
      setIsProcessing(false);
      setSheetAction(null);
    }
  };

  const runSheetAction = async () => {
    if (!coupon || !sheetAction) return;
    const action = sheetAction;
    setIsProcessing(true);
    try {
      const result = action === 'CLAIM'
        ? await claimCoupon(coupon.coupon_code)
        : await cancelCoupon(coupon.id);
      if (!result.success) {
        notify(result.error || `Could not ${action.toLowerCase()} this coupon.`);
        return;
      }
      const changedAt = new Date().toISOString();
      setCoupon(current => current ? {
        ...current,
        status: action === 'CLAIM' ? 'CLAIMED' : 'CANCELLED',
        ...(action === 'CLAIM' ? { claimed_at: changedAt } : { cancelled_at: changedAt }),
      } : current);
      notify(action === 'CLAIM' ? 'Coupon claimed.' : 'Coupon cancelled.');
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'The action could not be completed.');
    } finally {
      setIsProcessing(false);
      setSheetAction(null);
    }
  };

  if (isLoading) return <p className="page-state">Loading coupon…</p>;
  if (error || !coupon) {
    return <div className="page-state"><p>{error || 'Coupon not found.'}</p><Link href="/dashboard/coupons">Back to Coupons</Link></div>;
  }

  const status = computeDisplayStatus(coupon);
  const canResend = status === 'ACTIVE' || status === 'NOT_ACTIVE';
  const verificationUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/verify/${coupon.coupon_code}`;
  const sheetCopy = {
    CLAIM: ['Claim Coupon', 'Are you sure you want to claim this coupon?', 'Yes, Claim'],
    CANCEL: ['Cancel Coupon', 'Are you sure you want to cancel this coupon?', 'Yes, Cancel'],
  } as const;
  const activeCopy = sheetAction && sheetAction !== 'WHATSAPP' ? sheetCopy[sheetAction] : null;

  return (
    <div className="coupon-detail-page">
      {toast && <div className="app-toast" role="status">{toast}</div>}
      <BottomSheet
        isOpen={!!sheetAction}
        onClose={() => setSheetAction(null)}
        title={sheetAction === 'WHATSAPP' ? 'Send on WhatsApp' : (activeCopy?.[0] || '')}
        description={sheetAction === 'WHATSAPP' ? `Send this coupon to +91 ${coupon.phone_number}:` : (activeCopy?.[1] || '')}
        details={{ code: coupon.coupon_code, customerName: coupon.customer_name, value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0) }}
        actionsDirection={sheetAction === 'WHATSAPP' ? 'column' : 'row'}
        primaryButtonText={sheetAction === 'WHATSAPP' ? '📷 Share QR Image & Text (WhatsApp)' : (activeCopy?.[2] || 'Continue')}
        primaryButtonAction={sheetAction === 'WHATSAPP' ? handleShareQrImage : runSheetAction}
        secondaryButtonText={sheetAction === 'WHATSAPP' ? `💬 Direct Chat with +91 ${coupon.phone_number}` : 'Go Back'}
        secondaryButtonAction={sheetAction === 'WHATSAPP' ? handleDirectChat : () => setSheetAction(null)}
        tertiaryButtonText={sheetAction === 'WHATSAPP' ? 'Cancel' : undefined}
        tertiaryButtonAction={sheetAction === 'WHATSAPP' ? () => setSheetAction(null) : undefined}
        isLoading={isProcessing}
      >
        {sheetAction === 'WHATSAPP' && (
          <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', margin: '4px 0 12px' }}>
            Choose <strong>Share QR Image</strong> to send the image card directly, or <strong>Direct Chat</strong> if the customer is not in your contacts.
          </p>
        )}
      </BottomSheet>

      <div className="page-heading"><h1>Coupon Details</h1></div>
      <section className="coupon-detail-section" aria-label="Coupon information">
        <p className="coupon-detail-status">{status.replace('_', ' ')}</p>
        <h2 className="coupon-detail-code">{coupon.coupon_code}</h2>
        <dl className="coupon-detail-fields">
          <div><dt>Customer</dt><dd>{coupon.customer_name}</dd></div>
          <div><dt>Mobile</dt><dd>+91 {coupon.phone_number}</dd></div>
          <div><dt>Value</dt><dd>{formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}</dd></div>
          <div><dt>Valid From</dt><dd>{formatIndianDate(coupon.valid_from)}</dd></div>
          <div><dt>Valid Until</dt><dd>{formatIndianDate(coupon.valid_until)}</dd></div>
        </dl>
      </section>

      <section className="coupon-detail-qr" aria-label="Coupon QR code">
        <h2>QR Code</h2>
        <div ref={qrRef} className="coupon-qr-code">
          <QRCodeSVG value={verificationUrl || coupon.coupon_code} size={168} level="M" />
          <p className="coupon-qr-unique-id">{coupon.coupon_code}</p>
        </div>
      </section>

      <section className="coupon-detail-actions" aria-label="Coupon actions">
        {status === 'ACTIVE' && <button className="action-primary" onClick={() => setSheetAction('CLAIM')}>Claim Coupon</button>}
        {canResend && <button className="action-secondary" onClick={() => setSheetAction('WHATSAPP')}>Send on WhatsApp</button>}
        {canResend && <button className="action-secondary" onClick={() => setSheetAction('CANCEL')}>Cancel Coupon</button>}
      </section>
    </div>
  );
}
