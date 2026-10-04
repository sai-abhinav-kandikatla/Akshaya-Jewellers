'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCoupon } from '@/app/actions/coupons';
import { validateCouponForm } from '@/lib/utils/validators';
import { getTodayIST } from '@/lib/utils/formatters';

export default function CreateCouponPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    couponValue: '',
    validFrom: '',
    validUntil: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Set default Valid From to today IST
    setFormData(prev => ({ ...prev, validFrom: getTodayIST() }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setSubmitError('');
    
    // Validate form
    const validationResult = validateCouponForm(formData);
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        customer_name: formData.customerName,
        phone_number: formData.mobileNumber,
        coupon_value: Number(formData.couponValue),
        valid_from: formData.validFrom,
        valid_until: formData.validUntil,
      };
      
      const res = await createCoupon(payload);
      if (res.success && res.data) {
        router.push(`/dashboard/coupons/${res.data.coupon_code}/success`);
      } else {
        setSubmitError(res.error || res.message || 'Failed to create coupon. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the coupon.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#3E2723]">Create Gift Coupon</h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate an exclusive coupon for Akshaya Jewellers</p>
        </div>
      </div>

      <div className="card bg-white p-5 sm:p-7 rounded-2xl shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              Customer Mobile Number (🇮🇳 +91) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              inputMode="numeric"
              pattern="[0-9]*"
              className="form-input"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="9876543210"
              required
            />
            {errors.mobileNumber && <p className="text-xs text-red-600 mt-1 font-medium">{errors.mobileNumber}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="couponValue">
              Coupon Value (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="couponValue"
              name="couponValue"
              inputMode="numeric"
              className="form-input"
              value={formData.couponValue}
              onChange={handleChange}
              min="1"
              placeholder="e.g. 11111"
              required
            />
            {errors.couponValue && <p className="text-xs text-red-600 mt-1 font-medium">{errors.couponValue}</p>}
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

          <div className="pt-4">
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full font-bold text-base shadow-lg rounded-xl transition-all"
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
