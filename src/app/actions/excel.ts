'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Coupon } from '@/lib/types';
import { computeDisplayStatus } from '@/lib/utils/statusCompute';
import { formatDateIndian } from '@/lib/utils/formatters';

const graphTableUrl = (fileId: string) =>
  `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/CouponsTable`;

type ExcelTableRow = { index?: number; values?: unknown[][] };

function excelValues(coupon: Coupon) {
  const displayStatus = computeDisplayStatus(coupon.status, coupon.valid_from, coupon.valid_until);
  return [
    coupon.coupon_code,
    coupon.customer_name,
    coupon.phone_number,
    Number(coupon.value || (coupon as any).coupon_value || 0),
    coupon.campaign_id || 'Direct',
    formatDateIndian(coupon.valid_from),
    formatDateIndian(coupon.valid_until),
    displayStatus,
    formatDateIndian(coupon.created_at),
    coupon.claimed_at ? formatDateIndian(coupon.claimed_at) : '—',
    coupon.claimed_by || '—',
  ];
}

async function responseError(response: Response) {
  const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  return data?.error?.message || `Microsoft Excel sync failed (${response.status}).`;
}

async function loadExcelRows(token: string, fileId: string): Promise<ExcelTableRow[]> {
  const rows: ExcelTableRow[] = [];
  const pageSize = 500;
  const maxRows = 100_000;

  for (let skip = 0; skip < maxRows; skip += pageSize) {
    const response = await fetch(`${graphTableUrl(fileId)}/rows?$top=${pageSize}&$skip=${skip}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(await responseError(response));

    const page = await response.json() as { value?: ExcelTableRow[] };
    const pageRows = Array.isArray(page.value) ? page.value : [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) return rows;
  }

  throw new Error('Excel table is too large to safely locate coupon rows.');
}

async function updateSyncStatus(couponId: string, status: 'SYNCED' | 'PENDING' | 'ERROR') {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('coupons')
    .update({
      excel_sync_status: status,
      excel_synced_at: status === 'SYNCED' ? new Date().toISOString() : null,
    })
    .eq('id', couponId);
  if (error) throw new Error(`Could not save Excel sync status: ${error.message}`);
}

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
export async function syncCouponsToExcel(coupons: Coupon[]): Promise<ApiResponse[]> {
  if (coupons.length === 0) return [];

  const token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN;
  const fileId = process.env.ONEDRIVE_EXCEL_FILE_ID;
  if (!token || !fileId) {
    await Promise.all(coupons.map((coupon) => updateSyncStatus(coupon.id, 'PENDING').catch(() => undefined)));
    return coupons.map(() => ({
      success: false,
      error: 'Microsoft Excel sync is pending because Graph credentials are not configured.',
    }));
  }

  let rowIndexes = new Map<string, number[]>();
  try {
    const rows = await loadExcelRows(token, fileId);
    rowIndexes = new Map();
    for (const row of rows) {
      const index = Number(row.index);
      const code = String(row.values?.[0] ?? '').trim().toUpperCase();
      if (!Number.isInteger(index) || !code) continue;
      rowIndexes.set(code, [...(rowIndexes.get(code) || []), index]);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read Excel rows.';
    await Promise.all(coupons.map((coupon) => updateSyncStatus(coupon.id, 'ERROR').catch(() => undefined)));
    return coupons.map(() => ({ success: false, error: message }));
  }

  const results: ApiResponse[] = new Array(coupons.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < coupons.length) {
      const current = cursor++;
      const coupon = coupons[current];
      try {
        const matches = rowIndexes.get(coupon.coupon_code.trim().toUpperCase()) || [];
        const values = excelValues(coupon);
        const requests = matches.length
          ? matches.map((index) => fetch(`${graphTableUrl(fileId)}/rows/${index}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ index, values: [values] }),
            }))
          : [fetch(`${graphTableUrl(fileId)}/rows/add`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values: [values] }),
            })];

        const responses = await Promise.all(requests);
        const failed = responses.find((response) => !response.ok);
        if (failed) throw new Error(await responseError(failed));

        await updateSyncStatus(coupon.id, 'SYNCED');
        results[current] = { success: true, message: 'Excel row updated.' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync coupon to Excel.';
        await updateSyncStatus(coupon.id, 'ERROR').catch(() => undefined);
        results[current] = { success: false, error: message };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(6, coupons.length) }, worker));
  return results;
}

export async function syncCouponToExcel(coupon: Coupon): Promise<ApiResponse> {
  const [result] = await syncCouponsToExcel([coupon]);
  return result;
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

    const results = await syncCouponsToExcel(coupons);
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
