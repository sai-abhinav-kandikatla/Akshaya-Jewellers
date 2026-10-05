'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Coupon } from '@/lib/types';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { formatDateIndian } from '@/lib/utils/formatters';

export interface ExcelSyncResult {
  status: 'SYNCED' | 'PENDING' | 'ERROR';
  configured: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  totalSynced: number;
  errorCount: number;
  message?: string;
}

/**
 * Synchronize a coupon to Microsoft Excel / Cloud Reporting layer
 */
export async function syncCouponToExcel(coupon: Coupon): Promise<ApiResponse> {
  try {
    const supabase = createAdminClient();
    const displayStatus = computeDisplayStatus(coupon.status, coupon.valid_from, coupon.valid_until);

    const msGraphToken = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN;
    const excelFileId = process.env.ONEDRIVE_EXCEL_FILE_ID;

    // Row Data payload conforming to Section 19 of Master Prompt
    const rowData = {
      'Coupon Code': coupon.coupon_code,
      'Customer': coupon.customer_name,
      'Phone': coupon.phone_number,
      'Value': Number(coupon.value || (coupon as any).coupon_value || 0),
      'Campaign': coupon.campaign_id || 'Direct',
      'Valid From': formatDateIndian(coupon.valid_from),
      'Valid Until': formatDateIndian(coupon.valid_until),
      'Status': displayStatus,
      'Created At': formatDateIndian(coupon.created_at),
      'Claimed At': coupon.claimed_at ? formatDateIndian(coupon.claimed_at) : '—',
      'Claimed By': coupon.claimed_by || '—',
    };

    if (!msGraphToken || !excelFileId) {
      await supabase
        .from('coupons')
        .update({ excel_sync_status: 'PENDING', excel_synced_at: null })
        .eq('id', coupon.id);

      return {
        success: false,
        error: 'Microsoft Excel sync is pending because Graph credentials are not configured.',
      };
    }

    {
      // Execute live Microsoft Graph API Excel workbook row insert/update
      const graphUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${excelFileId}/workbook/tables/CouponsTable/rows/add`;
      const res = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${msGraphToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            rowData['Coupon Code'],
            rowData['Customer'],
            rowData['Phone'],
            rowData['Value'],
            rowData['Campaign'],
            rowData['Valid From'],
            rowData['Valid Until'],
            rowData['Status'],
            rowData['Created At'],
            rowData['Claimed At'],
            rowData['Claimed By'],
          ]],
        }),
      });

      if (res.ok) {
        await supabase
          .from('coupons')
          .update({
            excel_sync_status: 'SYNCED',
            excel_synced_at: new Date().toISOString(),
          } as any)
          .eq('id', coupon.id);

        return { success: true, message: 'Synchronized live to Microsoft Excel Workbook.' };
      } else {
        const errorData = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        console.warn('Microsoft Graph Excel sync error:', errorData);
        await supabase
          .from('coupons')
          .update({ excel_sync_status: 'ERROR', excel_synced_at: null })
          .eq('id', coupon.id);
        return {
          success: false,
          error: errorData?.error?.message || `Microsoft Excel sync failed (${res.status}).`,
        };
      }
    }
  } catch (err: any) {
    console.error('syncCouponToExcel exception:', err);
    return { success: false, error: err.message || 'Failed to sync to Excel.' };
  }
}

/**
 * Get current Excel Sync Status for Dashboard & Settings
 */
export async function getExcelSyncStatus(): Promise<ExcelSyncResult> {
  try {
    const supabase = createAdminClient();
    const { data: coupons, error } = await supabase.from('coupons').select('excel_sync_status, excel_synced_at, created_at');

    if (error || !coupons) {
      return {
        status: 'ERROR',
        configured: Boolean(process.env.MICROSOFT_GRAPH_ACCESS_TOKEN && process.env.ONEDRIVE_EXCEL_FILE_ID),
        lastSyncAt: null,
        pendingCount: 0,
        totalSynced: 0,
        errorCount: 0,
        message: 'Unable to read Excel sync status.',
      };
    }

    const totalSynced = coupons.filter((c: any) => c.excel_sync_status === 'SYNCED').length;
    const pendingCount = coupons.filter((c: any) => c.excel_sync_status === 'PENDING').length;
    const errorCount = coupons.filter((c: any) => c.excel_sync_status === 'ERROR').length;
    
    // Find latest synced at timestamp
    const latestSync = coupons
      .map((c: any) => c.excel_synced_at)
      .filter(Boolean)
      .sort()
      .pop();

    return {
      status: errorCount > 0 ? 'ERROR' : pendingCount > 0 || !process.env.MICROSOFT_GRAPH_ACCESS_TOKEN || !process.env.ONEDRIVE_EXCEL_FILE_ID ? 'PENDING' : 'SYNCED',
      configured: Boolean(process.env.MICROSOFT_GRAPH_ACCESS_TOKEN && process.env.ONEDRIVE_EXCEL_FILE_ID),
      lastSyncAt: latestSync || null,
      pendingCount,
      totalSynced,
      errorCount,
      message: !process.env.MICROSOFT_GRAPH_ACCESS_TOKEN || !process.env.ONEDRIVE_EXCEL_FILE_ID
        ? 'Microsoft Graph credentials are not configured.'
        : undefined,
    };
  } catch (err) {
    return {
      status: 'ERROR',
      configured: Boolean(process.env.MICROSOFT_GRAPH_ACCESS_TOKEN && process.env.ONEDRIVE_EXCEL_FILE_ID),
      lastSyncAt: null,
      pendingCount: 0,
      totalSynced: 0,
      errorCount: 0,
      message: 'Unable to read Excel sync status.',
    };
  }
}

/**
 * Trigger manual SYNC NOW to synchronize all pending coupons to Excel
 */
export async function triggerExcelSyncNow(): Promise<ApiResponse> {
  try {
    const supabase = createAdminClient();
    const { data: coupons, error: queryError } = await supabase
      .from('coupons')
      .select('*')
      .in('excel_sync_status', ['PENDING', 'ERROR']);

    if (queryError || !coupons) {
      return { success: false, error: queryError?.message || 'Failed to load pending coupons.' };
    }

    if (!coupons.length) {
      return { success: true, message: 'No pending coupons need Excel sync.' };
    }

    const results = await Promise.all(coupons.map((coupon) => syncCouponToExcel(coupon)));
    const failures = results.filter((result) => !result.success);
    if (failures.length) {
      return {
        success: false,
        error: `${failures.length} coupon${failures.length === 1 ? '' : 's'} could not be synced. ${failures[0].error || ''}`.trim(),
      };
    }

    return { success: true, message: `${results.length} pending coupon${results.length === 1 ? '' : 's'} synced to Excel.` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Manual Excel sync failed.' };
  }
}
