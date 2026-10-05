'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCoupon } from '@/app/actions/coupons';
import { validateCouponForm } from '@/lib/utils/validators';
import { getTodayIST, formatCurrency } from '@/lib/utils/formatters';
import BottomSheet from '@/components/BottomSheet';
import type { Campaign, Coupon } from '@/lib/types';

export default function CreateCouponClient({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    couponValue: '',
    campaignId: '',
    validFrom: getTodayIST(),
    validUntil: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingCoupon, setExistingCoupon] = useState<Coupon | null>(null);
  const submitLock = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const safeValue = name === 'mobileNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData(prev => ({ ...prev, [name]: safeValue }));
    setExistingCoupon(null);
    setSubmitError('');
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
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
        setSubmitError(res.error || res.message || 'Something went wrong while creating the coupon.');
        submitLock.current = false;
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong while creating the coupon.');
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-coupon-page space-y-4 max-w-[430px] mx-auto w-full pb-8">
      {/* Existing Coupon Bottom Sheet */}
      {existingCoupon && (
        <BottomSheet
          isOpen={true}
          onClose={() => setExistingCoupon(null)}
          title="Coupon Already Exists"
          description={`A gift coupon is already registered for +91 ${existingCoupon.phone_number}.`}
          details={{
            code: existingCoupon.coupon_code,
            customerName: existingCoupon.customer_name,
            value: formatCurrency(existingCoupon.coupon_value ?? existingCoupon.value ?? 0),
            date: `Valid until ${existingCoupon.valid_until}`,
          }}
          primaryButtonText="Open Existing"
          primaryButtonAction={() => router.push(`/dashboard/coupons/${existingCoupon.coupon_code}`)}
          secondaryButtonText="Change Number"
          secondaryButtonAction={() => setExistingCoupon(null)}
        />
      )}

      {/* 
        ==================================================
        15. CREATE SCREEN HEADER
        ==================================================
      */}
      <div className="page-heading create-page-heading">
        <Link
          href="/dashboard"
          className="create-page-back"
          aria-label="Back to dashboard"
        >
          <svg className="w-4 h-4 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1>Create Coupon</h1>
      </div>

      {/* Main Form Card */}
      <div className="create-coupon-form bg-white p-5 rounded-2xl border border-[#E7E0CF] shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-xl bg-white border border-[#E7E0CF] text-xs font-medium text-[#111111]">
              {submitError}
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] block" htmlFor="customerName">
              Customer Name <span className="text-[#A67C00]">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              className="w-full h-[52px] px-3.5 rounded-xl border border-[#E7E0CF] bg-white text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#C9A227] transition-colors"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              autoCapitalize="words"
              required
            />
            {errors.customerName && <p className="text-[11px] text-[#A67C00] font-medium">{errors.customerName}</p>}
          </div>

          {/* Mobile Number (+91) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] block" htmlFor="mobileNumber">
              Mobile Number <span className="text-[#A67C00]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-semibold text-[#666666] select-none">
                +91
              </span>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                className="w-full h-[52px] pl-12 pr-3.5 rounded-xl border border-[#E7E0CF] bg-white text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#C9A227] transition-colors"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="98765 43210"
                autoComplete="tel-national"
                required
              />
            </div>
            {errors.mobileNumber && <p className="text-[11px] text-[#A67C00] font-medium">{errors.mobileNumber}</p>}
          </div>

          {/* Coupon Value (₹) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] block" htmlFor="couponValue">
              Coupon Value (₹) <span className="text-[#A67C00]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-bold text-[#666666] select-none">
                ₹
              </span>
              <input
                type="number"
                id="couponValue"
                name="couponValue"
                inputMode="numeric"
                min="1"
                step="1"
                className="w-full h-[52px] pl-8 pr-3.5 rounded-xl border border-[#E7E0CF] bg-white text-sm font-semibold text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#C9A227] transition-colors"
                value={formData.couponValue}
                onChange={handleChange}
                placeholder="5000"
                required
              />
            </div>
            {errors.couponValue && <p className="text-[11px] text-[#A67C00] font-medium">{errors.couponValue}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111111] block" htmlFor="campaignId">Campaign</label>
            <select
              id="campaignId"
              name="campaignId"
              className="w-full h-[52px] px-3.5 rounded-xl border border-[#E7E0CF] bg-white text-sm text-[#111111] focus:outline-none focus:border-[#C6A15B] transition-colors"
              value={formData.campaignId}
              onChange={handleChange}
            >
              <option value="">No campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>

          {/* Valid From & Valid Until */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111111] block" htmlFor="validFrom">
                Valid From <span className="text-[#A67C00]">*</span>
              </label>
              <input
                type="date"
                id="validFrom"
                name="validFrom"
                className="w-full h-[52px] px-3 rounded-xl border border-[#E7E0CF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#C9A227] transition-colors"
                value={formData.validFrom}
                onChange={handleChange}
                required
              />
              {errors.validFrom && <p className="text-[11px] text-[#A67C00] font-medium">{errors.validFrom}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111111] block" htmlFor="validUntil">
                Valid Until <span className="text-[#A67C00]">*</span>
              </label>
              <input
                type="date"
                id="validUntil"
                name="validUntil"
                className="w-full h-[52px] px-3 rounded-xl border border-[#E7E0CF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#C9A227] transition-colors"
                value={formData.validUntil}
                onChange={handleChange}
                required
              />
              {errors.validUntil && <p className="text-[11px] text-[#A67C00] font-medium">{errors.validUntil}</p>}
            </div>
          </div>

          {/* Submit Button (Section 15: 56px height, gold, black text) */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-[#111111] font-bold text-sm tracking-wider uppercase shadow-sm hover:brightness-105 active:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-[#111111] border-t-transparent inline-block rounded-full animate-spin" />
                  <span>Generating…</span>
                </span>
              ) : (
                'Generate Coupon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
