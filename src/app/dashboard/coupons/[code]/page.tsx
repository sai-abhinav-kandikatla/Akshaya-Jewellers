'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode, claimCoupon, cancelCoupon } from '@/app/actions/coupons';
import { getCampaignById } from '@/app/actions/campaigns';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import BottomSheet from '@/components/BottomSheet';
import type { Coupon } from '@/lib/types';

type SheetAction = 'CLAIM' | 'CANCEL' | 'WHATSAPP' | null;

export default function CouponDetailPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [campaignName, setCampaignName] = useState('—');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetAction, setSheetAction] = useState<SheetAction>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState('');

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
        const campaign = data.campaign_id ? await getCampaignById(data.campaign_id) : null;
        if (active) setCampaignName(campaign?.name || '—');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load coupon details.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [params]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const runSheetAction = async () => {
    if (!coupon || !sheetAction) return;
    const action = sheetAction;
    if (action === 'WHATSAPP') {
      window.open(generateWhatsAppURL(coupon), '_blank', 'noopener,noreferrer');
      setSheetAction(null);
      return;
    }
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
    WHATSAPP: ['Resend WhatsApp', `Open WhatsApp to send this coupon to +91 ${coupon.phone_number}?`, 'Open WhatsApp'],
  } as const;
  const activeCopy = sheetAction ? sheetCopy[sheetAction] : null;

  return (
    <div className="coupon-detail-page">
      {toast && <div className="app-toast" role="status">{toast}</div>}
      <BottomSheet
        isOpen={!!sheetAction}
        onClose={() => setSheetAction(null)}
        title={activeCopy?.[0] || ''}
        description={activeCopy?.[1] || ''}
        details={{ code: coupon.coupon_code, customerName: coupon.customer_name, value: formatCurrency(coupon.coupon_value ?? coupon.value ?? 0) }}
        primaryButtonText={activeCopy?.[2] || 'Continue'}
        primaryButtonAction={runSheetAction}
        secondaryButtonText="Go Back"
        secondaryButtonAction={() => setSheetAction(null)}
        isLoading={isProcessing}
      />

      <div className="page-heading"><h1>Coupon Details</h1></div>
      <section className="coupon-detail-section" aria-label="Coupon information">
        <p className="coupon-detail-status">{status.replace('_', ' ')}</p>
        <h2 className="coupon-detail-code">{coupon.coupon_code}</h2>
        <dl className="coupon-detail-fields">
          <div><dt>Customer</dt><dd>{coupon.customer_name}</dd></div>
          <div><dt>Mobile</dt><dd>+91 {coupon.phone_number}</dd></div>
          <div><dt>Value</dt><dd>{formatCurrency(coupon.coupon_value ?? coupon.value ?? 0)}</dd></div>
          <div><dt>Campaign</dt><dd>{campaignName}</dd></div>
          <div><dt>Valid From</dt><dd>{formatIndianDate(coupon.valid_from)}</dd></div>
          <div><dt>Valid Until</dt><dd>{formatIndianDate(coupon.valid_until)}</dd></div>
        </dl>
      </section>

      <section className="coupon-detail-qr" aria-label="Coupon QR code">
        <h2>QR Code</h2>
        <div className="coupon-qr-code"><QRCodeSVG value={verificationUrl || coupon.coupon_code} size={168} level="M" /></div>
      </section>

      <section className="coupon-detail-actions" aria-label="Coupon actions">
        {status === 'ACTIVE' && <button className="action-primary" onClick={() => setSheetAction('CLAIM')}>Claim Coupon</button>}
        {canResend && <button className="action-secondary" onClick={() => setSheetAction('WHATSAPP')}>Resend WhatsApp</button>}
        {canResend && <button className="action-secondary" onClick={() => setSheetAction('CANCEL')}>Cancel Coupon</button>}
      </section>
    </div>
  );
}
