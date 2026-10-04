'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminSessionToken } from '@/lib/auth/adminSession';

export async function adminLoginAction(usernameInput: string, passwordInput: string) {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return { success: false, error: 'Admin login is not configured on the server.' };
    }

    const cleanInput = usernameInput.trim();
    const isAdminUser = cleanInput.toLowerCase() === adminUsername.toLowerCase() || 
                         cleanInput.toLowerCase() === 'akshaya_jewellers' ||
                         cleanInput.toLowerCase() === 'akshaya_jewellers@akshayajewellers.com';

    const isCorrectPassword = passwordInput === adminPassword;

    if (!isAdminUser || !isCorrectPassword) {
      return { success: false, error: 'Invalid username or password' };
    }

    const sessionToken = await createAdminSessionToken();
    if (!sessionToken) {
      return { success: false, error: 'Admin session signing is not configured on the server.' };
    }

    const email = 'akshaya_jewellers@akshayajewellers.com';
    const supabase = await createClient();

    // 1. Attempt login with Supabase
    let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: adminPassword,
    });

    // 2. If user not found in Supabase auth table, auto-provision
    if (signInErr) {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password: adminPassword,
      });

      if (!signUpErr && signUpData.user) {
        // Try sign in again after signup
        const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
          email,
          password: adminPassword,
        });
        if (!retryErr) {
          signInData = retryData;
          signInErr = null;
        }
      }
    }

    // Set fallback admin session cookie to guarantee login even if email confirmation is required by Supabase
    const cookieStore = await cookies();
    cookieStore.set('akshaya_admin_session', sessionToken.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionToken.maxAge,
    });

    cookieStore.set('akshaya_admin_email', email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, message: 'Logged in successfully' };
  } catch (err: any) {
    console.error('adminLoginAction exception:', err);
    return { success: false, error: err.message || 'Login failed' };
  }
}

export async function adminLogoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    // Ignore signout errors
  }

  const cookieStore = await cookies();
  cookieStore.delete('akshaya_admin_session');
  cookieStore.delete('akshaya_admin_email');

  return { success: true };
}
