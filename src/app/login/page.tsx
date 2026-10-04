'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [usernameInput, setUsernameInput] = useState('Akshaya_Jewellers');
  const [password, setPassword] = useState('Akshaya@00');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Normalize username or email
    const trimmedInput = usernameInput.trim();
    let email = trimmedInput;

    if (!email.includes('@')) {
      // Map username to internal admin email format
      const cleanUsername = trimmedInput.toLowerCase().replace(/[^a-z0-9_]/g, '');
      email = `${cleanUsername}@akshayajewellers.com`;
    }

    try {
      // 1. Try standard sign in
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. If user doesn't exist yet on Supabase project, auto-provision initial admin account
      if (signInError && (signInError.message.includes('Invalid login credentials') || signInError.message.includes('User not found'))) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (!signUpError) {
          // Retry login immediately after provisioning
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          signInError = retryError;
        }
      }

      if (signInError) {
        throw signInError;
      }

      // Success -> Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="flex-center mb-4">
          <div className="login-logo">
            <Image src="/logo.png" alt="Akshaya Jewellers Logo" width={80} height={80} priority />
          </div>
        </div>
        <h1 className="login-title text-center">Akshaya Jewellers</h1>
        <p className="text-muted text-center mb-6">Admin Gift Coupon Management System</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Akshaya_Jewellers"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Akshaya@00"
              required
            />
          </div>

          {error && (
            <div className="form-error mb-4 p-3 text-center rounded bg-red-50 text-red-600 border border-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg mt-4"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'SIGN IN'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500 border-t border-gray-100 pt-4">
          🔒 Restricted Access • Akshaya Jewellers Staff Only
        </div>
      </div>
    </div>
  );
}
