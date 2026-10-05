'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/utils/identifiers';
import { ApiResponse, Coupon } from '@/lib/types';
import { generateWhatsAppMessage } from '@/lib/utils/whatsapp';
import { isAdminAuthenticated } from '@/lib/auth/requireAdmin';
import { writeAuditEvent } from '@/lib/audit/events';

export async function getWhatsAppCloudApiStatus(): Promise<{ configured: boolean }> {
  if (!(await isAdminAuthenticated())) return { configured: false };
  return {
    configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  };
}

export async function isWhatsAppConfigured(): Promise<boolean> {
  const status = await getWhatsAppCloudApiStatus();
  return status.configured;
}

export async function sendWhatsAppCloudAPI(coupon: Coupon): Promise<ApiResponse> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized.' };
    if (!coupon || typeof coupon.id !== 'string' || !isUuid(coupon.id)) {
      return { success: false, error: 'A valid coupon is required.' };
    }
    const supabase = createAdminClient();
    const { data: savedCoupon, error: lookupError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', coupon.id)
      .maybeSingle();
    if (lookupError || !savedCoupon) return { success: false, error: 'Coupon not found.' };
    if (['CLAIMED', 'CANCELLED', 'EXPIRED'].includes(savedCoupon.status)) {
      return { success: false, error: 'WhatsApp cannot be sent for a claimed, cancelled, or expired coupon.' };
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Clean phone number (Indian 10-digit format prefixed with 91)
    let rawPhone = (savedCoupon.phone_number || '').replace(/\D/g, '');
    if (rawPhone.length === 10) rawPhone = '91' + rawPhone;
    if (!/^[1-9]\d{9,14}$/.test(rawPhone)) return { success: false, error: 'Coupon has an invalid mobile number.' };

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(savedCoupon.coupon_code)}`;
    const wasAlreadySent = savedCoupon.whatsapp_status === 'SENT';
    const messageText = generateWhatsAppMessage(savedCoupon);

    if (token && phoneId) {
      // Official WhatsApp Business Cloud API Endpoint — Send QR image with message caption
      const apiRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: rawPhone,
          type: 'image',
          image: {
            link: qrImageUrl,
            caption: messageText,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      const responseData = await apiRes.json();

      if (apiRes.ok && responseData.messages?.[0]?.id) {
        const msgId = responseData.messages[0].id;
        const { error: updateError } = await supabase
          .from('coupons')
          .update({
            whatsapp_status: 'SENT',
            whatsapp_message_id: msgId,
          } as any)
          .eq('id', savedCoupon.id);
        await writeAuditEvent(wasAlreadySent ? 'WHATSAPP_RESENT' : 'WHATSAPP_SENT', savedCoupon.id, savedCoupon.campaign_id || undefined, { message_id: msgId });

        return {
          success: true,
          message: 'Coupon QR image and text sent successfully via WhatsApp Cloud API.',
          ...(updateError ? { warning: 'The message was sent, but its status could not be saved.' } : {}),
        };
      } else {
        console.warn('WhatsApp Cloud API error response:', responseData);
        await supabase
          .from('coupons')
          .update({ whatsapp_status: 'FAILED' } as any)
          .eq('id', savedCoupon.id);
        await writeAuditEvent('WHATSAPP_FAILED', savedCoupon.id, savedCoupon.campaign_id || undefined, { reason: responseData.error?.message || `HTTP ${apiRes.status}` });

        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp could not send the coupon QR image and text.',
        };
      }
    }

    // Without Cloud API credentials, prepare a wa.me link for the operator.
    await supabase
      .from('coupons')
      .update({ whatsapp_status: 'PREPARED' } as any)
      .eq('id', savedCoupon.id);
    await writeAuditEvent('WHATSAPP_PREPARED', savedCoupon.id, savedCoupon.campaign_id || undefined);

    return {
      success: true,
      message: 'WhatsApp message is ready to send. Cloud API credentials are not configured.',
    };
  } catch (err: any) {
    console.error('sendWhatsAppCloudAPI error:', err);
    return { success: false, error: err.message || 'WhatsApp sending failed.' };
  }
}

/**
 * Retry WhatsApp sending for a failed or pending coupon
 */
export async function retryWhatsAppSending(identifier: string): Promise<ApiResponse> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized.' };
    if (typeof identifier !== 'string' || !identifier.trim()) return { success: false, error: 'Enter a coupon code.' };
    const supabase = createAdminClient();
    const query = supabase
      .from('coupons')
      .select('*');
    const search = identifier.trim();
    const { data: coupon, error } = isUuid(search)
      ? await query.eq('id', search).maybeSingle()
      : await query.eq('coupon_code', search.toUpperCase()).maybeSingle();

    if (error) {
      console.error('retryWhatsAppSending lookup error:', error);
      return { success: false, error: 'Unable to load this coupon from the database. Check the Supabase configuration and try again.' };
    }
    if (!coupon) {
      return { success: false, error: 'Coupon not found.' };
    }

    return await sendWhatsAppCloudAPI(coupon as Coupon);
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retry WhatsApp sending.' };
  }
}
