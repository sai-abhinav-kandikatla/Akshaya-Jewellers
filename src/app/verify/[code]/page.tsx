export const dynamic = 'force-dynamic';

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatIndianDate, formatDateTime } from '@/lib/utils/formatters';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { Coupon } from '@/lib/types';

// This is a Server Component. It can directly fetch from DB using server client.
export default async function PublicVerifyPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const code = resolvedParams.code;
  
  // RLS must allow anon SELECT for coupons table for this to work
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('coupon_code', code)
    .single();

  if (error || !coupon) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#f9fafb' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ color: '#111827', marginBottom: '0.5rem' }}>Invalid Coupon</h2>
          <p style={{ color: '#6b7280' }}>The coupon code you are trying to verify does not exist or is invalid.</p>
        </div>
      </div>
    );
  }

  const status = computeDisplayStatus(coupon as Coupon);
  
  const getStatusEmoji = (s: string) => {
    switch (s) {
      case 'ACTIVE': return '✅';
      case 'CLAIMED': return '🎉';
      case 'EXPIRED': return '⏰';
      case 'NOT_ACTIVE': return '⏳';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#fdfbf7' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Brand Header */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '1.75rem 1.5rem', textAlign: 'center', color: '#d4af37', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Akshaya Jewellers Logo" className="w-14 h-14 rounded-full object-cover mb-2 border border-[#D4AF37]" />
          <h1 style={{ fontSize: '1.4rem', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>Akshaya Jewellers</h1>
          <p style={{ fontSize: '0.875rem', letterSpacing: '1px', opacity: 0.8, marginTop: '0.25rem' }}>Digital Gift Coupon</p>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Coupon Code</p>
            <h2 style={{ fontSize: '2rem', letterSpacing: '2px', color: '#111827', margin: '0.25rem 0' }}>{coupon.coupon_code}</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed #d1d5db' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Gift For</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>{coupon.customer_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Value</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d4af37' }}>{formatCurrency(coupon.value)}</p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Valid From</span>
              <span style={{ fontWeight: '500' }}>{formatIndianDate(coupon.valid_from)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Valid Until</span>
              <span style={{ fontWeight: '500' }}>{formatIndianDate(coupon.valid_until)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{getStatusEmoji(status)}</div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                {status}
              </span>
            </div>
            
            {status === 'CLAIMED' && (
              <p style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.5rem' }}>
                Redeemed on {coupon.claimed_at ? formatDateTime(coupon.claimed_at) : ''}
              </p>
            )}
            {status === 'EXPIRED' && (
              <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginTop: '0.5rem' }}>
                Expired on {formatIndianDate(coupon.valid_until)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
            Please visit <strong>Akshaya Jewellers</strong> to redeem this coupon.
          </p>
        </div>
      </div>
    </div>
  );
}
