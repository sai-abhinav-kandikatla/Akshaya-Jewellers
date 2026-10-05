'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDateIndian } from '@/lib/utils/formatters';

export default function AuditLogClient({ initialLogs }: { initialLogs: any[] }) {
  const logs = initialLogs;
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = filterAction === 'ALL' 
    ? logs 
    : logs.filter(log => log.action === filterAction);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'VERIFY': return 'bg-purple-100 text-purple-800';
      case 'CLAIM': return 'bg-indigo-100 text-indigo-800';
      case 'CANCEL': return 'bg-gray-100 text-gray-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      COUPON_CREATED: 'Coupon Created',
      COUPON_CLAIMED: 'Coupon Redeemed',
      COUPON_CANCELLED: 'Coupon Cancelled',
      WHATSAPP_PREPARED: 'WhatsApp Prepared',
      CAMPAIGN_CREATED: 'Campaign Created',
      CAMPAIGN_UPDATED: 'Campaign Updated',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  return (
    <div className="audit-log-page p-4 md:p-8">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Audit Log</h1>
        <div className="filter-bar">
          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="form-input bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="VERIFY">Verify</option>
            <option value="CLAIM">Claim</option>
            <option value="CANCEL">Cancel</option>
          </select>
        </div>
      </div>

      <div className="card bg-white rounded-lg shadow overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="empty-state p-12 text-center text-gray-500">
            No audit logs found.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon Code</th>
                    <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">
                        {formatDateIndian(log.created_at)}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`badge px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium">
                        {log.coupon_code ? (
                          <Link href={`/dashboard/coupons/${log.coupon_code}`} className="text-[#3E2723] hover:underline">
                            {log.coupon_code}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="audit-timeline md:hidden">
              {filteredLogs.map((log) => (
                <div key={log.id} className="audit-entry">
                  <div className="flex justify-between items-start">
                    <span className={`badge px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDateIndian(log.created_at)}</span>
                  </div>
                  {log.coupon_code && (
                    <div className="audit-mobile-details">
                      <span className="text-xs text-gray-500 block mb-1">Coupon</span>
                      <Link href={`/dashboard/coupons/${log.coupon_code}`} className="text-[#3E2723] font-medium text-sm hover:underline">
                        {log.coupon_code}
                      </Link>
                    </div>
                  )}
                  {log.details && (
                    <div>
                       <span className="text-xs text-gray-500 block mb-1">Details</span>
                       <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 font-mono break-all">
                         {JSON.stringify(log.details)}
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Showing {filteredLogs.length} logs</span>
              {/* Pagination could go here */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
