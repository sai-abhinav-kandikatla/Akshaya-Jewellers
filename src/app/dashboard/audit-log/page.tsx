import { getAuditLogs } from '@/app/actions/audit';
import AuditLogClient from './AuditLogClient';

export default async function AuditLogPage() {
  const result = await getAuditLogs({ page: 1, per_page: 20 });
  return <AuditLogClient initialLogs={result.logs} />;
}
