// ==============================================================================
// WhatsApp Message Generator
// ==============================================================================

import { formatCurrency } from './formatters';

export interface WhatsAppMessageData {
  customerName?: string;
  customer_name?: string;
  phoneNumber?: string;
  phone_number?: string;
  couponCode?: string;
  coupon_code?: string;
  couponValue?: number;
  coupon_value?: number;
  value?: number;
  validFrom?: string;
  valid_from?: string;
  validUntil?: string;
  valid_until?: string;
}

export function formatVoucherDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00+05:30');
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate the exact WhatsApp message text for a coupon
 */
export function generateWhatsAppMessage(data: any): string {
  const name = data.customerName || data.customer_name || 'Valued Customer';
  const val = data.couponValue ?? data.coupon_value ?? data.value ?? 0;
  const code = data.couponCode || data.coupon_code || '';
  const from = data.validFrom || data.valid_from || '';
  const until = data.validUntil || data.valid_until || '';

  return `✨ *AKSHAYA JEWELLERS* ✨
*Exclusive Gift Coupon*

Dear ${name},

Warm greetings from Akshaya Jewellers! 🌟

💎 *Coupon Details:*
• Coupon Code: *${code}*
• Coupon Value: *${formatCurrency(val)}*
• Valid From: ${formatVoucherDate(from)}
• Valid Until: ${formatVoucherDate(until)}

Thank you for choosing Akshaya Jewellers! 💍✨`;
}

/**
 * Generate a WhatsApp wa.me URL with pre-filled message
 */
export function generateWhatsAppURL(data: any): string {
  const message = generateWhatsAppMessage(data);
  const rawPhone = data.phoneNumber || data.phone_number || '';
  
  // Normalize phone number to international format
  let phone = rawPhone.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = '91' + phone; // Add India country code
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
