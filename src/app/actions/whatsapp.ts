'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Coupon } from '@/lib/types';
import { generateWhatsAppMessage } from '@/lib/utils/whatsapp';

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

    // Default: Mark ready for instant wa.me link sending
    await supabase
      .from('coupons')
      .update({ whatsapp_status: 'SENT' } as any)
      .eq('id', coupon.id);

    return {
      success: true,
      message: 'WhatsApp message prepared for instant customer delivery.',
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
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .or(`coupon_code.eq.${identifier},id.eq.${identifier}`)
      .single();

    if (error || !coupon) {
      return { success: false, error: 'Coupon not found.' };
    }

    return await sendWhatsAppCloudAPI(coupon as Coupon);
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retry WhatsApp sending.' };
  }
}
