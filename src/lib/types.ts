// ==============================================================================
// AKSHAYA JEWELLERS — Type Definitions
// ==============================================================================

export type CouponStatus = 'NOT_ACTIVE' | 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

export type CampaignStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export type AuditAction = 
  | 'COUPON_CREATED'
  | 'COUPON_CLAIMED'
  | 'COUPON_CANCELLED'
  | 'WHATSAPP_PREPARED'
  | 'WHATSAPP_SENT'
  | 'WHATSAPP_FAILED'
  | 'WHATSAPP_RESENT'
  | 'COUPON_EXPIRED'
  | 'COUPON_VIEWED'
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_UPDATED'
  | 'LOGIN'
  | 'LOGOUT';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type AuditEvent = AuditLog;

export interface Coupon {
  id: string;
  coupon_code: string;
  customer_name: string;
  phone_number: string;
  coupon_value: number;
  value?: number; // Alias for coupon_value
  campaign_id: string | null;
  valid_from: string;
  valid_until: string;
  status: string; // Stored status (ACTIVE, CLAIMED, CANCELLED)
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  whatsapp_status?: 'SENT' | 'PREPARED' | 'FAILED' | null;
  // Joined fields
  campaign?: Campaign | null;
}

export interface CouponWithDisplayStatus extends Coupon {
  display_status: CouponStatus;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  coupon_id: string | null;
  campaign_id: string | null;
  details: Record<string, unknown>;
  description?: string;
  created_at: string;
  // Joined fields
  coupon?: Pick<Coupon, 'coupon_code' | 'customer_name'> | null;
  coupon_code?: string | null;
  customer_name?: string | null;
}

export interface DashboardStats {
  total_count: number;
  active_count: number;
  not_active_count: number;
  claimed_count: number;
  expired_count: number;
  cancelled_count: number;
  total_value: number;
  active_value: number;
  not_active_value: number;
  claimed_value: number;
  expired_value: number;
}

export interface CreateCouponInput {
  customer_name: string;
  phone_number: string;
  coupon_value: number;
  valid_from: string;
  valid_until: string;
  campaign_id?: string | null;
  discount_value?: number;
  discount_type?: string;
  minimum_purchase?: number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  budget?: number;
}

export interface CouponFilters {
  status?: CouponStatus | 'ALL' | string;
  search?: string;
  campaign_id?: string;
  campaignId?: string;
  date_from?: string;
  date_to?: string;
  value_min?: number;
  value_max?: number;
  customer?: string;
  phone?: string;
  page?: number;
  per_page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  coupon_code?: string;
  created?: boolean;
  warning?: string;
}

