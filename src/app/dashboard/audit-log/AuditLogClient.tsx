'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDateIndian } from '@/lib/utils/formatters';
import type { AuditLog } from '@/lib/types';

const actions = ['COUPON_CREATED', 'COUPON_CLAIMED', 'COUPON_CANCELLED', 'WHATSAPP_PREPARED', 'CAMPAIGN_CREATED', 'CAMPAIGN_UPDATED'];
const labels: Record<string, string> = {
  COUPON_CREATED: 'Coupon Created',
  COUPON_CLAIMED: 'Coupon Claimed',
  COUPON_CANCELLED: 'Coupon Cancelled',
  WHATSAPP_PREPARED: 'WhatsApp Prepared',
  CAMPAIGN_CREATED: 'Campaign Created',
  CAMPAIGN_UPDATED: 'Campaign Updated',
};

export default function AuditLogClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [filterAction, setFilterAction] = useState('ALL');
  const filteredLogs = filterAction === 'ALL' ? initialLogs : initialLogs.filter(log => log.action === filterAction);

  return (
    <div className="audit-log-page">
      <header className="audit-log-heading">
        <div><h1>Activity</h1><p>{filteredLogs.length} records</p></div>
        <label className="sr-only" htmlFor="auditAction">Filter activity</label>
        <select id="auditAction" value={filterAction} onChange={event => setFilterAction(event.target.value)}>
          <option value="ALL">All activity</option>
          {actions.map(action => <option value={action} key={action}>{labels[action]}</option>)}
        </select>
      </header>

      {filteredLogs.length === 0 ? (
        <p className="page-state">No activity found.</p>
      ) : (
        <div className="audit-log-rows">
          {filteredLogs.map(log => (
            <article className="audit-log-row" key={log.id}>
              <div className="audit-log-row-heading">
                <h2>{labels[log.action] || log.action.replace(/_/g, ' ')}</h2>
                <time>{formatDateIndian(log.created_at)}</time>
              </div>
              {log.coupon_code && <Link href={`/dashboard/coupons/${log.coupon_code}`}>{log.coupon_code}</Link>}
              {log.details && <p>{JSON.stringify(log.details)}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
