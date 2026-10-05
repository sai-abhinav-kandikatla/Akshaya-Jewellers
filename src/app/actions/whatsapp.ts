'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/utils/identifiers';
import { ApiResponse, Coupon } from '@/lib/types';
import { generateWhatsAppMessage } from '@/lib/utils/whatsapp';

export async function getWhatsAppCloudApiStatus(): Promise<{ configured: boolean }> {
  return {
    configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  };
}

export async function sendWhatsAppCloudAPI(coupon: Coupon, verificationUrl?: string): Promise<ApiResponse> {
  try {
    const supabase = createAdminClient();
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Clean phone number (Indian 10-digit format prefixed with 91)
    let rawPhone = (coupon.phone_number || '').replace(/\D/g, '');
    if (rawPhone.length === 10) rawPhone = '91' + rawPhone;

    const messageText = generateWhatsAppMessage(coupon, verificationUrl);

    if (token && phoneId) {
      // Official WhatsApp Business Cloud API Endpoint
      const apiRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: rawPhone,
          type: 'text',
          text: { body: messageText },
        }),
      });

      const responseData = await apiRes.json();

      if (apiRes.ok && responseData.messages?.[0]?.id) {
        const msgId = responseData.messages[0].id;
        await supabase
          .from('coupons')
          .update({
            whatsapp_status: 'SENT',
            whatsapp_message_id: msgId,
          } as any)
          .eq('id', coupon.id);

        return { success: true, message: 'WhatsApp message sent successfully via WhatsApp Cloud API!' };
      } else {
        console.warn('WhatsApp Cloud API error response:', responseData);
        await supabase
          .from('coupons')
          .update({ whatsapp_status: 'FAILED' } as any)
          .eq('id', coupon.id);

        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp Cloud API failed to deliver message.',
        };
      }
    }

    // Without Cloud API credentials, prepare a wa.me link for the operator.
    await supabase
      .from('coupons')
      .update({ whatsapp_status: 'PREPARED' } as any)
      .eq('id', coupon.id);

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
