'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLoginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminLoginAction(usernameInput, password);

      if (res.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(res.error || 'Invalid username or password');
      }
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
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="Akshaya Jewellers Logo" className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-md" />
        </div>
        <h1 className="login-title text-center mb-1">Akshaya Jewellers</h1>
        <p className="text-muted text-center mb-6">Admin Gift Coupon Management System</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="form-input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter your admin username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
