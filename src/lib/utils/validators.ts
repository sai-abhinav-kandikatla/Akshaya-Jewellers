// ==============================================================================
// Input Validators
// ==============================================================================

/**
 * Validate an Indian mobile number (10 digits, starts with 6-9)
 */
export function isValidIndianMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Support 10-digit or +91/91 prefix
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(digits);
  }
  return false;
}

/**
 * Normalize phone number to 10 digits
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Validate coupon value (must be > 0)
 */
export function isValidCouponValue(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
}

/**
 * Validate customer name (non-empty, reasonable length)
 */
export function isValidCustomerName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 200;
}

/**
 * Validate date range: valid_until must be >= valid_from
 */
export function isValidDateRange(validFrom: string, validUntil: string): boolean {
  if (!validFrom || !validUntil) return false;
  return new Date(validUntil) >= new Date(validFrom);
}

/**
 * Get all validation errors for coupon creation form
 */
export function validateCouponForm(data: {
  customer_name?: string;
  customerName?: string;
  phone_number?: string;
  mobileNumber?: string;
  coupon_value?: string | number;
  couponValue?: string | number;
  valid_from?: string;
  validFrom?: string;
  valid_until?: string;
  validUntil?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const name = data.customer_name || data.customerName || '';
  const phone = data.phone_number || data.mobileNumber || '';
  const val = data.coupon_value !== undefined ? data.coupon_value : data.couponValue;
  const validFrom = data.valid_from || data.validFrom || '';
  const validUntil = data.valid_until || data.validUntil || '';

  if (!isValidCustomerName(name)) {
    errors.customer_name = 'Customer name is required.';
    errors.customerName = 'Customer name is required.';
  }

  if (!phone) {
    errors.phone_number = 'Mobile number is required.';
    errors.mobileNumber = 'Mobile number is required.';
  } else if (!isValidIndianMobile(phone)) {
    errors.phone_number = 'Enter a valid Indian mobile number.';
    errors.mobileNumber = 'Enter a valid Indian mobile number.';
  }

  if (val === undefined || val === '') {
    errors.coupon_value = 'Coupon value is required.';
    errors.couponValue = 'Coupon value is required.';
  } else if (!isValidCouponValue(val)) {
    errors.coupon_value = 'Coupon value must be greater than ₹0.';
    errors.couponValue = 'Coupon value must be greater than ₹0.';
  }

  if (!validFrom) {
    errors.valid_from = 'Valid From date is required.';
    errors.validFrom = 'Valid From date is required.';
  }

  if (!validUntil) {
    errors.valid_until = 'Valid Until date is required.';
    errors.validUntil = 'Valid Until date is required.';
  }

  if (validFrom && validUntil && !isValidDateRange(validFrom, validUntil)) {
    errors.valid_until = 'Valid Until cannot be before Valid From.';
    errors.validUntil = 'Valid Until cannot be before Valid From.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
