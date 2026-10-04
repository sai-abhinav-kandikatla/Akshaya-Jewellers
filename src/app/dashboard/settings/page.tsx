'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    }
    getUser();
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <div className="card bg-white rounded-lg shadow overflow-hidden">
          <div className="card-header px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Account Profile</h2>
          </div>
          <div className="card-body p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="text-base font-medium text-gray-900">{userEmail || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="card bg-white rounded-lg shadow overflow-hidden">
          <div className="card-header px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Security</h2>
          </div>
          <div className="card-body p-6">
            {message.text && (
              <div className={`mb-4 p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}

            {!isChangingPassword ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">Ensure your account is using a long, random password to stay secure.</p>
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="btn btn-secondary px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
                <div className="form-group">
                  <label className="form-label block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button 
                    type="submit"
                    className="btn btn-primary px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3E2723] hover:bg-[#2D1C19]"
                  >
                    Save Password
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setIsChangingPassword(false); setMessage({type:'', text:''}); }}
                    className="btn btn-ghost px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="card bg-white rounded-lg shadow overflow-hidden">
          <div className="card-header px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">About</h2>
          </div>
          <div className="card-body p-6 flex items-center space-x-4">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain bg-gray-100 rounded-md" />
            <div>
              <p className="font-semibold text-gray-900">Akshaya Jewellery Digital Gift Coupon System</p>
              <p className="text-sm text-gray-500">Version 1.0.0</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card bg-white rounded-lg shadow overflow-hidden border border-red-100">
          <div className="card-header px-6 py-4 border-b border-red-100 bg-red-50">
            <h2 className="text-lg font-medium text-red-800">Danger Zone</h2>
          </div>
          <div className="card-body p-6 flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <p className="text-base font-medium text-gray-900">Log out of your account</p>
              <p className="text-sm text-gray-500">You will need to log back in to access the dashboard.</p>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-4 sm:mt-0 btn btn-danger px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
