// ==============================================================================
// WhatsApp Message Generator
// Uses free wa.me pre-filled message links
// ==============================================================================

import { formatCurrency, formatDateIndian } from './formatters';

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

/**
 * Generate the WhatsApp message text for a coupon
 */
export function generateWhatsAppMessage(data: any, verificationUrl?: string): string {
  const name = data.customerName || data.customer_name || 'Valued Customer';
  const val = data.couponValue ?? data.coupon_value ?? data.value ?? 0;
  const code = data.couponCode || data.coupon_code || '';
  const from = data.validFrom || data.valid_from || '';
  const until = data.validUntil || data.valid_until || '';

  let msg = `✨ *AKSHAYA JEWELLERS* ✨
*Exclusive Gift Coupon*

Dear *${name}*,

Warm greetings from *Akshaya Jewellers*! 🌟
We are delighted to present you with an exclusive Gift Coupon.

💎 *Coupon Details:*
• *Coupon Code:* ${code}
• *Coupon Value:* *${formatCurrency(val)}*
• *Valid From:* ${formatDateIndian(from)}
• *Valid Until:* ${formatDateIndian(until)}`;

  if (verificationUrl) {
    msg += `\n\n🔍 *Verify & View Coupon Online:*
${verificationUrl}`;
  }

  msg += `\n\n📍 *How to Redeem:*
Please present this message or coupon code at our Akshaya Jewellers store during your purchase.

Thank you for choosing Akshaya Jewellers! 💍✨
_Terms & Conditions Apply._`;

  return msg;
}

/**
 * Generate a WhatsApp wa.me URL with pre-filled message
 */
export function generateWhatsAppURL(data: any, verificationUrl?: string): string {
  const message = generateWhatsAppMessage(data, verificationUrl);
  const rawPhone = data.phoneNumber || data.phone_number || '';
  
  // Normalize phone number to international format
  let phone = rawPhone.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = '91' + phone; // Add India country code
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
