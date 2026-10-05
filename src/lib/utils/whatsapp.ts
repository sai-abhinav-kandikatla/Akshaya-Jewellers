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

export type CouponShareResult = 'shared' | 'prepared' | 'cancelled';

export async function createCouponQrImageFile(svg: SVGSVGElement, couponCode: string): Promise<File> {
  const markup = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not load the coupon QR image.'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the coupon QR image.');

    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not export the coupon QR image.')), 'image/png');
    });
    return new File([png], `${couponCode}-QR.png`, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function prepareWhatsAppFallback(imageFile: File, data: WhatsAppMessageData): CouponShareResult {
  const imageUrl = URL.createObjectURL(imageFile);
  const downloadLink = document.createElement('a');
  downloadLink.href = imageUrl;
  downloadLink.download = imageFile.name;
  downloadLink.click();
  window.setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
  window.open(generateWhatsAppURL(data), '_blank', 'noopener,noreferrer');
  return 'prepared';
}

/** Share the actual coupon QR image and its text, with a WhatsApp-link fallback. */
export function shareCouponQrFileWithText(imageFile: File, data: WhatsAppMessageData): Promise<CouponShareResult> {
  const message = generateWhatsAppMessage(data);

  if (navigator.share && navigator.canShare?.({ files: [imageFile] })) {
    return navigator.share({
      files: [imageFile],
      title: 'Akshaya Jewellers coupon',
      text: message,
    }).then(() => 'shared' as const).catch(error => {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
      return prepareWhatsAppFallback(imageFile, data);
    });
  }

  return Promise.resolve(prepareWhatsAppFallback(imageFile, data));
}
