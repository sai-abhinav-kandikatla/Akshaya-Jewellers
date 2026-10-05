// ==============================================================================
// Status Computation — Display status from stored status + dates
// ==============================================================================

import type { CouponStatus } from '@/lib/types';

export function getISTDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Compute the display status for a coupon.
 * CLAIMED, CANCELLED, and EXPIRED are terminal — they never change.
 * Otherwise, status is computed from current IST date vs validity dates.
 */
export function computeDisplayStatus(
  storedStatusOrCoupon: string | { status: string; valid_from: string; valid_until: string },
  validFromStr?: string,
  validUntilStr?: string,
  now = new Date()
): CouponStatus {
  let storedStatus: string;
  let validFrom: string;
  let validUntil: string;

  if (typeof storedStatusOrCoupon === 'object') {
    storedStatus = storedStatusOrCoupon.status;
    validFrom = storedStatusOrCoupon.valid_from;
    validUntil = storedStatusOrCoupon.valid_until;
  } else {
    storedStatus = storedStatusOrCoupon;
    validFrom = validFromStr || '';
    validUntil = validUntilStr || '';
  }

  // Terminal states: always return as-is
  if (storedStatus === 'CLAIMED') return 'CLAIMED';
  if (storedStatus === 'CANCELLED') return 'CANCELLED';
  if (storedStatus === 'EXPIRED') return 'EXPIRED';

  // Compare ISO dates in IST. A coupon remains valid for the whole valid_until date.
  const today = getISTDateString(now);
  const from = validFrom ? validFrom.split('T')[0] : '';
  const until = validUntil ? validUntil.split('T')[0] : '';

  if (today < from) return 'NOT_ACTIVE';
  if (today > until) return 'EXPIRED';
  return 'ACTIVE';
}

/**
 * Get the color CSS class for a status
 */
export function getStatusColor(status: CouponStatus): string {
  switch (status) {
    case 'ACTIVE': return 'status-active';
    case 'NOT_ACTIVE': return 'status-not-active';
    case 'CLAIMED': return 'status-claimed';
    case 'EXPIRED': return 'status-expired';
    case 'CANCELLED': return 'status-cancelled';
    default: return '';
  }
}

/**
 * Get the status emoji
 */
export function getStatusEmoji(status: CouponStatus): string {
  switch (status) {
    case 'ACTIVE': return '🟢';
    case 'NOT_ACTIVE': return '🟡';
    case 'CLAIMED': return '🔵';
    case 'EXPIRED': return '🔴';
    case 'CANCELLED': return '⚫';
    default: return '';
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: CouponStatus): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'NOT_ACTIVE': return 'Not Active';
    case 'CLAIMED': return 'Claimed';
    case 'EXPIRED': return 'Expired';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
}
