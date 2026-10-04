'use server'

import { ApiResponse } from '@/lib/types';
import { generateWhatsAppMessage } from '@/lib/utils/whatsapp';

export interface SendSMSInput {
  phoneNumber: string;
  customerName: string;
  couponCode: string;
  couponValue: number;
  validFrom: string;
  validUntil: string;
  verificationUrl?: string;
}

/**
 * Send SMS or WhatsApp notification to customer
 */
export async function sendCouponSMS(input: SendSMSInput): Promise<ApiResponse> {
  try {
    const message = generateWhatsAppMessage({
      customerName: input.customerName,
      couponCode: input.couponCode,
      couponValue: input.couponValue,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
    }, input.verificationUrl);

    // 1. Check for Fast2SMS API Key (India SMS Gateway)
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
      const cleanPhone = input.phoneNumber.replace(/\D/g, '').slice(-10);
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          numbers: cleanPhone,
        }),
      });

      const data = await res.json();
      if (data.return) {
        return { success: true, message: 'SMS sent successfully via Fast2SMS!' };
      } else {
        console.warn('Fast2SMS response:', data);
      }
    }

    // 2. Check for Twilio API credentials
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioAuthToken && twilioPhone) {
      let formattedPhone = input.phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length === 10) formattedPhone = '+91' + formattedPhone;
      if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        To: formattedPhone,
        From: twilioPhone,
        Body: message,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, message: 'SMS sent successfully via Twilio!' };
      } else {
        console.warn('Twilio response:', data);
      }
    }

    // If no SMS API key configured, return info for WhatsApp Web fallback
    return {
      success: true,
      message: 'SMS service ready. (Use WhatsApp button for instant direct messaging or configure FAST2SMS_API_KEY / TWILIO_ACCOUNT_SID in environment variables).',
    };
  } catch (err: any) {
    console.error('sendCouponSMS error:', err);
    return { success: false, error: err.message || 'Failed to send SMS.' };
  }
}
