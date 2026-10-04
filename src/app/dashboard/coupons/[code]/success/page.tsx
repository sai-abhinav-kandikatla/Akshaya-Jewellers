'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getCouponByCode } from '@/app/actions/coupons';
import { logAuditEvent } from '@/app/actions/audit';
import { formatCurrency, formatIndianDate } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { generateWhatsAppURL } from '@/lib/utils/whatsapp';
import { Coupon } from '@/lib/types';

export default function CouponSuccessPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ id: number, message: string, type: string } | null>(null);

  useEffect(() => {
    async function fetchCoupon() {
      try {
        const data = await getCouponByCode(params.code);
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
    
    // Check if params exists
    if (params && params.code) {
      fetchCoupon();
    }
  }, [params]);

  const handleCopyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.coupon_code);
      setToast({ id: Date.now(), message: 'Coupon code copied to clipboard!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleWhatsApp = async () => {
    if (coupon) {
      await logAuditEvent('WHATSAPP_PREPARED', coupon.id, coupon.campaign_id || undefined, {
        phone_number: coupon.phone_number
      });
      
      const verificationUrl = `${window.location.origin}/verify/${coupon.coupon_code}`;
      const url = generateWhatsAppURL(coupon, verificationUrl);
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error || !coupon) {
    return <div className="empty-state"><h3>{error || 'Coupon not found'}</h3></div>;
  }

  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${coupon.coupon_code}` 
    : `https://akshayajewellery.com/verify/${coupon.coupon_code}`;

  const displayStatus = computeDisplayStatus(coupon);

  return (
    <div className="success-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
      
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <div className="success-animation" style={{ marginBottom: '1.5rem' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '80px', height: '80px' }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h1 style={{ marginBottom: '2rem', color: '#166534' }}>Coupon Created Successfully!</h1>

      <div className="card coupon-card" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <p className="stat-label">Customer</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{coupon.customer_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="stat-label">Value</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b8860b' }}>
                {formatCurrency(coupon.value)}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#fdfbf7', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem', border: '1px dashed #d4af37' }}>
            <p className="stat-label">Coupon Code</p>
            <h2 style={{ fontSize: '2rem', letterSpacing: '2px', margin: '0.5rem 0' }}>{coupon.coupon_code}</h2>
            <span className={`badge badge-${displayStatus.toLowerCase().replace('_', '-')}`}>
              {displayStatus}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p className="stat-label">Valid From</p>
              <p>{formatIndianDate(coupon.valid_from)}</p>
            </div>
            <div>
              <p className="stat-label">Valid Until</p>
              <p>{formatIndianDate(coupon.valid_until)}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <QRCodeSVG value={verificationUrl} size={150} level="M" includeMargin={true} />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '0.5rem' }}>Scan to verify</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button onClick={handleWhatsApp} className="btn btn-whatsapp" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          SEND ON WHATSAPP
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Link href={`/dashboard/coupons/${coupon.coupon_code}`} className="btn btn-secondary" style={{ textAlign: 'center' }}>
            VIEW COUPON
          </Link>
          <button onClick={handleCopyCode} className="btn btn-ghost">
            COPY CODE
          </button>
        </div>
        
        <Link href="/dashboard/coupons/create" className="btn btn-secondary" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          CREATE ANOTHER
        </Link>
      </div>
    </div>
  );
}
