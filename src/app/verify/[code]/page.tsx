export const dynamic = 'force-dynamic';

import React from 'react';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { isUuid } from '@/lib/utils/identifiers';
import CouponQRCode from '@/components/CouponQRCode';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> | { code: string } }): Promise<Metadata> {
  const { code } = await params;
  const upperCode = (code || '').toUpperCase();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(upperCode)}`;

  return {
    title: `Akshaya Jewellers Coupon - ${upperCode}`,
    description: `Digital Gift Coupon ${upperCode} from Akshaya Jewellers.`,
    openGraph: {
      title: `Akshaya Jewellers Gift Coupon - ${upperCode}`,
      description: `Scan or present this digital gift coupon at Akshaya Jewellers to redeem.`,
      images: [
        {
          url: qrImageUrl,
          width: 600,
          height: 600,
          alt: `Akshaya Jewellers Coupon ${upperCode} QR Code`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Akshaya Jewellers Coupon - ${upperCode}`,
      images: [qrImageUrl],
    },
  };
}

export default async function PublicVerifyPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const supabase = createAdminClient();
  const { code } = await params;
  const query = supabase.from('coupons').select('coupon_code, customer_name, coupon_value, valid_from, valid_until, status, claimed_at');
  const { data: coupon, error } = isUuid(code)
    ? await query.eq('id', code).maybeSingle()
    : await query.eq('coupon_code', code.toUpperCase()).maybeSingle();

  if (error) console.error('Public coupon verification database error:', error);
  if (error || !coupon) {
    return (
      <main className="public-verify-page">
        <section className="public-verification-card public-verification-error">
          <BrandHeader />
          <div className="public-verification-content">
            <h2>Invalid Coupon</h2>
            <p>{error ? 'Coupon verification is temporarily unavailable. Please try again.' : 'This coupon code is invalid or no longer available.'}</p>
          </div>
        </section>
      </main>
    );
  }

  const status = computeDisplayStatus(coupon);
  const statusMessage = {
    ACTIVE: 'This coupon is valid. Ask store staff to redeem it.',
    CLAIMED: `This coupon was claimed${coupon.claimed_at ? ` on ${formatIndianDate(coupon.claimed_at)}` : ''}.`,
    EXPIRED: `This coupon expired on ${formatIndianDate(coupon.valid_until)}.`,
    CANCELLED: 'This coupon has been cancelled.',
    NOT_ACTIVE: `This coupon becomes valid on ${formatIndianDate(coupon.valid_from)}.`,
  }[status];

  return (
    <main className="public-verify-page">
      <section className="public-verification-card">
        <BrandHeader />
        <div className="public-verification-content">
          <div className="public-code-block">
            <p>Coupon Code</p>
            <h2>{coupon.coupon_code}</h2>
          </div>
          <dl className="public-coupon-details">
            <div><dt>Customer</dt><dd>{coupon.customer_name}</dd></div>
            <div><dt>Value</dt><dd>{formatCurrency(coupon.coupon_value)}</dd></div>
            <div><dt>Valid From</dt><dd>{formatIndianDate(coupon.valid_from)}</dd></div>
            <div><dt>Valid Until</dt><dd>{formatIndianDate(coupon.valid_until)}</dd></div>
          </dl>
          <div className="public-coupon-qr">
            <CouponQRCode value={coupon.coupon_code} size={160} label={coupon.coupon_code} />
          </div>
          <div className="public-status-result" role="status">
            <p>{status.replace('_', ' ')}</p>
            <span>{statusMessage}</span>
          </div>
        </div>
        <footer className="public-verification-footer">Visit an Akshaya Jewellers store to redeem this coupon.</footer>
      </section>
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="public-verification-brand">
      <img src="/logo.png" alt="" />
      <div><h1>Akshaya Jewellers</h1><p>Digital Gift Coupon</p></div>
    </header>
  );
}
