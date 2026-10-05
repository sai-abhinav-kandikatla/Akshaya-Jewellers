import 'server-only';

import { cookies } from 'next/headers';
import { verifyAdminSessionToken } from '@/lib/auth/adminSession';

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = (await cookies()).get('akshaya_admin_session')?.value;
  return verifyAdminSessionToken(session);
}

export async function requireAdminSession(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Unauthorized. Please sign in and try again.');
  }
}
