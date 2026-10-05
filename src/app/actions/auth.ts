'use server';

import { after } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminSessionToken } from '@/lib/auth/adminSession';
import { writeAuditEvent } from '@/lib/audit/events';

export async function adminLoginAction(usernameInput: string, passwordInput: string) {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return {
        success: false,
        error: 'Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD as server-side environment variables, then redeploy.',
      };
    }

    if (typeof usernameInput !== 'string' || typeof passwordInput !== 'string') {
      return { success: false, error: 'Invalid username or password' };
    }

    const cleanInput = usernameInput.trim();
    const isAdminUser = cleanInput.toLowerCase() === adminUsername.trim().toLowerCase();
    const isCorrectPassword = passwordInput === adminPassword;

    if (!isAdminUser || !isCorrectPassword) {
      return { success: false, error: 'Invalid username or password' };
    }

    const sessionToken = await createAdminSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: 'Admin session signing is not configured. Set ADMIN_SESSION_SECRET as a server-side environment variable, then redeploy.',
      };
    }

    const email = adminUsername.trim();
    const cookieStore = await cookies();
    cookieStore.set('akshaya_admin_session', sessionToken.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionToken.maxAge,
    });

    cookieStore.set('akshaya_admin_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    after(() => writeAuditEvent('LOGIN', undefined, undefined, { username: email }));

    return { success: true, message: 'Logged in successfully' };
  } catch (err: any) {
    console.error('adminLoginAction exception:', err);
    return { success: false, error: err.message || 'Login failed' };
  }
}

export async function adminLogoutAction() {
  after(() => writeAuditEvent('LOGOUT'));
  const cookieStore = await cookies();
  cookieStore.delete('akshaya_admin_session');
  cookieStore.delete('akshaya_admin_email');

  return { success: true };
}
