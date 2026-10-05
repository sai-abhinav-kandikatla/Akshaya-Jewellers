// ==============================================================================
// Coupon Code Generator
// Format: AKS-XXXXXX (6 alphanumeric characters, no ambiguous chars)
// ==============================================================================

// Exclude ambiguous characters: 0/O, 1/I/L
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a random coupon code in the format AKS-XXXXXX
 */
export function generateCouponCode(): string {
  const codeLength = 6;
  let code = '';

  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure randomness is not available in this runtime.');
  }

  const array = new Uint32Array(codeLength);
  globalThis.crypto.getRandomValues(array);
  for (let i = 0; i < codeLength; i++) {
    code += CHARSET[array[i] % CHARSET.length];
  }

  return `AKS-${code}`;
}

/**
 * Validate that a string looks like a valid coupon code
 */
export function isValidCouponCode(code: string): boolean {
  return /^AKS-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(code.toUpperCase());
}
