'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCoupon } from '@/app/actions/coupons';
import { getCampaigns } from '@/app/actions/campaigns';
import { validateCouponForm } from '@/lib/utils/validators';
import { getTodayIST } from '@/lib/utils/formatters';
import type { Campaign, Coupon } from '@/lib/types';

export default function CreateCouponPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    couponValue: '',
    validFrom: getTodayIST(),
    validUntil: '',
    campaignId: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingCoupon, setExistingCoupon] = useState<Coupon | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    getCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const safeValue = name === 'mobileNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData(prev => ({ ...prev, [name]: safeValue }));
    setExistingCoupon(null);
    setSubmitError('');
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    setSubmitError('');
    
    // Validate form
    const validationResult = validateCouponForm(formData);
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    
    try {
      const payload = {
        customer_name: formData.customerName,
        phone_number: formData.mobileNumber,
        coupon_value: Number(formData.couponValue),
        valid_from: formData.validFrom,
        valid_until: formData.validUntil,
        campaign_id: formData.campaignId || null,
      };
      
      const res = await createCoupon(payload);
      if (res.success && res.data) {
        if (res.created === false) {
          setExistingCoupon(res.data);
          submitLock.current = false;
          setIsSubmitting(false);
          return;
        }
        router.push(`/dashboard/coupons/${res.data.coupon_code}/success`);
      } else {
        setSubmitError(res.error || res.message || 'Failed to create coupon. Please try again.');
        submitLock.current = false;
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the coupon.');
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-coupon-page max-w-xl mx-auto space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="mobile-form-back md:hidden" aria-label="Back to dashboard">←</Link>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#3E2723]"><span className="hidden-mobile">Create Gift Coupon</span><span className="hidden-desktop">Create Coupon</span></h1>
          <p className="create-subtitle-desktop text-xs text-gray-500 mt-0.5 hidden-mobile">Generate an exclusive coupon for Akshaya Jewellers</p>
          <p className="create-subtitle-mobile text-sm text-gray-500 mt-1 hidden-desktop">Enter customer and validity details.</p>
        </div>
      </div>

      <div className="card bg-white p-5 sm:p-7 rounded-2xl shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          {existingCoupon && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="status">
              <p className="font-semibold">This mobile number already has a coupon.</p>
              <p className="mt-1">No new coupon was created, so a second coupon cannot be generated for this number.</p>
              <Link
                href={`/dashboard/coupons/${existingCoupon.coupon_code}`}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#25d366] px-4 py-2 font-bold text-white"
              >
                OPEN {existingCoupon.coupon_code}
              </Link>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
              ⚠️ {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="customerName">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              className="form-input"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g. Rahul / Ananya Sharma"
              autoCapitalize="words"
              required
            />
            {errors.customerName && <p className="text-xs text-red-600 mt-1 font-medium">{errors.customerName}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mobileNumber">
              <span className="hidden-mobile">Customer Mobile Number (🇮🇳 +91)</span><span className="hidden-desktop">Mobile Number</span> <span className="text-red-500">*</span>
            </label>
            <div className="mobile-number-field">
              <span className="mobile-number-prefix" aria-hidden="true">🇮🇳 +91</span>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                className="form-input"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="98765 43210"
                autoComplete="tel-national"
                required
              />
            </div>
            {errors.mobileNumber && <p className="text-xs text-red-600 mt-1 font-medium">{errors.mobileNumber}</p>}
          </div>

          <div className="form-group create-campaign-field">
            <label className="form-label" htmlFor="couponValue">
              Coupon Value (₹) <span className="text-red-500">*</span>
            </label>
            <div className="coupon-value-field">
              <span className="coupon-value-prefix" aria-hidden="true">₹</span>
              <input
                type="number"
                id="couponValue"
                name="couponValue"
                inputMode="numeric"
                className="form-input"
                value={formData.couponValue}
                onChange={handleChange}
                min="1"
                placeholder="11,111"
                required
              />
            </div>
            {errors.couponValue && <p className="text-xs text-red-600 mt-1 font-medium">{errors.couponValue}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="campaignId">Campaign</label>
            <select id="campaignId" name="campaignId" className="form-input" value={formData.campaignId} onChange={handleChange}>
              <option value="">No campaign</option>
              {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="validFrom">Valid From</label>
              <input
                type="date"
                id="validFrom"
                name="validFrom"
                className="form-input"
                value={formData.validFrom}
                onChange={handleChange}
                required
              />
              {errors.validFrom && <p className="text-xs text-red-600 mt-1 font-medium">{errors.validFrom}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="validUntil">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="validUntil"
                name="validUntil"
                className="form-input"
                value={formData.validUntil}
                onChange={handleChange}
                required
              />
              {errors.validUntil && <p className="text-xs text-red-600 mt-1 font-medium">{errors.validUntil}</p>}
            </div>
          </div>

          <div className="create-submit-wrap pt-4">
            <button
              type="submit"
              className="create-submit btn btn-primary btn-lg w-full font-bold text-base shadow-lg rounded-xl transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner w-5 h-5 border-2 border-black border-t-transparent inline-block rounded-full animate-spin" />
                  GENERATING...
                </span>
              ) : (
                'GENERATE COUPON'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
