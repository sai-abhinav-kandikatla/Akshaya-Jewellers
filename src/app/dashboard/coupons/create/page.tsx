'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCoupon } from '@/app/actions/coupons';
import { getCampaigns } from '@/app/actions/campaigns';
import { validateCouponForm } from '@/lib/utils/validators';
import { Campaign } from '@/lib/types';
import { getTodayIST } from '@/lib/utils/formatters';

export default function CreateCouponPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    couponValue: '',
    validFrom: '',
    validUntil: '',
    campaignId: ''
  });
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Set default Valid From to today IST
    setFormData(prev => ({ ...prev, validFrom: getTodayIST() }));

    // Fetch campaigns
    async function fetchCampaigns() {
      try {
        const data = await getCampaigns();
        if (data) setCampaigns(data);
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      }
    }
    fetchCampaigns();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field when typing
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
        campaign_id: formData.campaignId || undefined
      };
      
      const res = await createCoupon(payload);
      if (res.success && res.data) {
        router.push(`/dashboard/coupons/${res.data.coupon_code}/success`);
      } else {
        setSubmitError(res.error || res.message || 'Failed to create coupon.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the coupon.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="page-header">
        <h1>Create Gift Coupon</h1>
      </div>

      <div className="card card-gold">
        <form onSubmit={handleSubmit} className="card-body">
          {submitError && (
            <div className="toast-error" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px' }}>
              {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="customerName">Customer Name <span style={{color: 'red'}}>*</span></label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              className="form-input"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g. Ananya Sharma"
              required
            />
            {errors.customerName && <p className="form-error">{errors.customerName}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mobileNumber">Mobile Number <span style={{color: 'red'}}>*</span></label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              className="form-input"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="9876543210"
              required
            />
            {errors.mobileNumber && <p className="form-error">{errors.mobileNumber}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="couponValue">Coupon Value (₹) <span style={{color: 'red'}}>*</span></label>
            <input
              type="number"
              id="couponValue"
              name="couponValue"
              className="form-input"
              value={formData.couponValue}
              onChange={handleChange}
              min="1"
              placeholder="e.g. 5000"
              required
            />
            {errors.couponValue && <p className="form-error">{errors.couponValue}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="validFrom">Valid From</label>
            <input
              type="date"
              id="validFrom"
              name="validFrom"
              className="form-input"
              value={formData.validFrom}
              onChange={handleChange}
            />
            {errors.validFrom && <p className="form-error">{errors.validFrom}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="validUntil">Valid Until <span style={{color: 'red'}}>*</span></label>
            <input
              type="date"
              id="validUntil"
              name="validUntil"
              className="form-input"
              value={formData.validUntil}
              onChange={handleChange}
              required
            />
            {errors.validUntil && <p className="form-error">{errors.validUntil}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="campaignId">Campaign (Optional)</label>
            <select
              id="campaignId"
              name="campaignId"
              className="form-input"
              value={formData.campaignId}
              onChange={handleChange}
            >
              <option value="">-- Select a Campaign --</option>
              {campaigns.map(camp => (
                <option key={camp.id} value={camp.id}>{camp.name}</option>
              ))}
            </select>
          </div>

          <div className="card-footer" style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'GENERATE COUPON'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
