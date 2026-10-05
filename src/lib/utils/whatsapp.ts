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

export function getWhatsAppRecipientPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
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

  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://akshaya-jewellers-mncl.vercel.app';
  const verifyLink = code ? `${origin}/verify/${code}` : '';

  return `✨ *AKSHAYA JEWELLERS* ✨
*Exclusive Gift Coupon*

Dear ${name},

Warm greetings from Akshaya Jewellers! 🌟

💎 *Coupon Details:*
• Unique Coupon ID: *${code}*
• Coupon Value: *${formatCurrency(val)}*
• Valid From: ${formatVoucherDate(from)}
• Valid Until: ${formatVoucherDate(until)}${verifyLink ? `\n• View Coupon & QR: ${verifyLink}` : ''}

Please present this Unique Coupon ID (*${code}*) or the QR link at our store to redeem your gift.

Thank you for choosing Akshaya Jewellers! 💍✨`;
}

/**
 * Generate direct WhatsApp URL that immediately opens 1-on-1 chat with customer number.
 * Works even when customer number is NOT saved in phone contacts!
 */
export function generateWhatsAppURL(data: any): string {
  const message = generateWhatsAppMessage(data);
  const rawPhone = data.phoneNumber || data.phone_number || '';
  const phone = getWhatsAppRecipientPhone(rawPhone);
  const encodedMessage = encodeURIComponent(message);
  
  if (phone) {
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

export type CouponShareResult = 'shared' | 'prepared' | 'cancelled';

export async function createCouponQrImageFile(svg: SVGSVGElement, couponOrCode: any): Promise<File> {
  const couponCode = typeof couponOrCode === 'string'
    ? couponOrCode
    : (couponOrCode?.coupon_code || couponOrCode?.couponCode || '');

  const customerName = typeof couponOrCode === 'object'
    ? (couponOrCode?.customer_name || couponOrCode?.customerName || '')
    : '';

  const couponValue = typeof couponOrCode === 'object'
    ? (couponOrCode?.coupon_value ?? couponOrCode?.value ?? couponOrCode?.couponValue ?? 0)
    : 0;

  const validFrom = typeof couponOrCode === 'object'
    ? (couponOrCode?.valid_from || couponOrCode?.validFrom || '')
    : '';

  const validUntil = typeof couponOrCode === 'object'
    ? (couponOrCode?.valid_until || couponOrCode?.validUntil || '')
    : '';

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
    const width = 640;
    const height = 820;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the coupon QR image.');

    // 1. Crisp white background & border
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = '#E7E0CF';
    context.lineWidth = 4;
    context.strokeRect(2, 2, width - 4, height - 4);

    // 2. Top gold accent bar
    context.fillStyle = '#C9A227';
    context.fillRect(0, 0, width, 10);

    // 3. Header
    context.fillStyle = '#111111';
    context.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('AKSHAYA JEWELLERS', width / 2, 54);

    context.fillStyle = '#A67C00';
    context.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    context.fillText('DIGITAL GIFT COUPON', width / 2, 78);

    // Divider line
    context.strokeStyle = '#E7E0CF';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(40, 100);
    context.lineTo(width - 40, 100);
    context.stroke();

    // 4. QR Code Container Box
    const qrBoxSize = 340;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 118;

    context.fillStyle = '#FFFFFF';
    context.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
    context.strokeStyle = '#E7E0CF';
    context.lineWidth = 1.5;
    context.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

    // Draw the QR Code image
    const pad = 14;
    context.drawImage(image, qrBoxX + pad, qrBoxY + pad, qrBoxSize - pad * 2, qrBoxSize - pad * 2);

    // 5. Unique Coupon ID Label & Badge Box
    context.fillStyle = '#666666';
    context.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    context.fillText('UNIQUE COUPON ID', width / 2, 492);

    const idBoxW = 380;
    const idBoxH = 52;
    const idBoxX = (width - idBoxW) / 2;
    const idBoxY = 508;

    context.fillStyle = '#FDFBF7';
    context.fillRect(idBoxX, idBoxY, idBoxW, idBoxH);
    context.strokeStyle = '#C9A227';
    context.lineWidth = 2;
    context.strokeRect(idBoxX, idBoxY, idBoxW, idBoxH);

    // Prominent Unique ID Text
    context.fillStyle = '#111111';
    context.font = 'bold 28px ui-monospace, SFMono-Regular, "Courier New", Consolas, monospace';
    context.fillText(couponCode, width / 2, idBoxY + idBoxH / 2 + 1);

    // 6. Value, Customer, and Validity
    let currentY = 590;

    if (couponValue > 0) {
      context.fillStyle = '#A67C00';
      context.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      context.fillText(formatCurrency(couponValue), width / 2, currentY);
      currentY += 28;
    }

    if (customerName) {
      context.fillStyle = '#222222';
      context.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      context.fillText(`Customer: ${customerName}`, width / 2, currentY);
      currentY += 24;
    }

    if (validUntil) {
      context.fillStyle = '#666666';
      context.font = '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const validityText = validFrom
        ? `Valid: ${formatVoucherDate(validFrom)} – ${formatVoucherDate(validUntil)}`
        : `Valid until ${formatVoucherDate(validUntil)}`;
      context.fillText(validityText, width / 2, currentY);
      currentY += 24;
    }

    // 7. Footer Redemption Guidance
    context.strokeStyle = '#E7E0CF';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(40, 715);
    context.lineTo(width - 40, 715);
    context.stroke();

    context.fillStyle = '#666666';
    context.font = '400 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    context.fillText('Scan QR code or present Unique ID at store to redeem', width / 2, 746);

    context.fillStyle = '#A67C00';
    context.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    context.fillText('Akshaya Jewellers • Mancherial', width / 2, 770);

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not export the coupon QR image.')), 'image/png');
    });
    return new File([png], `${couponCode}-QR.png`, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function downloadCouponQrImage(imageFile: File): void {
  try {
    const imageUrl = URL.createObjectURL(imageFile);
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = imageFile.name || 'Akshaya-Coupon-QR.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
  } catch {
    // Graceful fallback
  }
}

export async function copyQrImageToClipboard(imageFile: File): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ [imageFile.type || 'image/png']: imageFile })
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Directly redirect to WhatsApp to open chat with customer number.
 * No need to save customer number in phone contacts!
 * Saves QR image to photos and copies it to clipboard so user can paste it.
 */
export async function redirectToWhatsAppDirect(data: any, imageFile?: File | null): Promise<void> {
  if (imageFile) {
    downloadCouponQrImage(imageFile);
    await copyQrImageToClipboard(imageFile).catch(() => false);
  }
  const url = generateWhatsAppURL(data);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.setTimeout(() => {
      window.location.href = url;
    }, 150);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Share the actual QR image card directly into WhatsApp / native apps.
 * Attaches the image file and sets the coupon text as caption.
 */
export async function shareCouponQrImageFile(imageFile: File, data: WhatsAppMessageData): Promise<CouponShareResult> {
  const message = generateWhatsAppMessage(data);

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({
        files: [imageFile],
        title: 'Akshaya Jewellers Gift Coupon',
        text: message,
      });
      return 'shared';
    } catch (error: any) {
      if (error && typeof error === 'object' && error.name === 'AbortError') {
        return 'cancelled';
      }
      // If native share fails, fallback to direct chat redirect
      await redirectToWhatsAppDirect(data, imageFile);
      return 'prepared';
    }
  }

  await redirectToWhatsAppDirect(data, imageFile);
  return 'prepared';
}

/**
 * Backward compatibility alias
 */
export function shareCouponQrFileWithText(imageFile: File, data: WhatsAppMessageData): Promise<CouponShareResult> {
  return shareCouponQrImageFile(imageFile, data);
}
