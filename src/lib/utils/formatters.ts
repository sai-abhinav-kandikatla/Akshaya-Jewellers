// ==============================================================================
// Formatting Utilities — IST dates, Indian currency, phone numbers
// ==============================================================================

/**
 * Format a date string to Indian display format: "12 October 2026"
 */
export function formatDateIndian(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00+05:30');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format a date string to short Indian format: "12 Oct 2026"
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00+05:30');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format a timestamp to Indian datetime: "18 October 2026, 4:32 PM"
 */
export function formatDateTimeIndian(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }) + ', ' + date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format a number as Indian currency: ₹1,250
 */
export function formatCurrency(value?: number | null): string {
  const val = value ?? 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Format Indian currency with decimals: ₹1,250.00
 */
export function formatCurrencyDetailed(value?: number | null): string {
  const val = value ?? 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Format phone number for display: +91 98765 43210
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Get a date string in YYYY-MM-DD format for form inputs, in IST
 */
export function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for input[type=date] value
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  // Handle ISO date strings
  return dateStr.split('T')[0];
}

/**
 * Relative time string: "2 hours ago", "3 days ago"
 */
export function timeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDateShort(timestamp);
}

// Aliases for compatibility
export const formatIndianDate = formatDateIndian;
export const formatDateTime = formatDateTimeIndian;

