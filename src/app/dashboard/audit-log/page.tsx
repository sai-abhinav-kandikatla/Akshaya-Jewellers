'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuditLogs } from '@/app/actions/audit';
import { formatDateIndian } from '@/lib/utils/formatters';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getAuditLogs();
        setLogs(data?.logs || []);
      } catch (error) {
        console.error('Error fetching logs', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

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

  return (
    <div className="p-4 md:p-8">
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
        {loading ? (
          <div className="loading-spinner flex justify-center py-12">
             <svg className="animate-spin h-8 w-8 text-[#D4AF37]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          </div>
        ) : filteredLogs.length === 0 ? (
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
            <div className="md:hidden divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`badge px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-500">{formatDateIndian(log.created_at)}</span>
                  </div>
                  {log.coupon_code && (
                    <div>
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
