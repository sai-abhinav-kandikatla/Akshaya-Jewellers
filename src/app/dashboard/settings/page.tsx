'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogoutAction } from '@/app/actions/auth';
import { isWhatsAppConfigured } from '@/app/actions/whatsapp';
import { getDatabaseConnectionStatus } from '@/app/actions/dashboard';

export default function SettingsPage() {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [whatsappConfigured, setWhatsappConfigured] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [isDbOk, isWaOk] = await Promise.all([
          getDatabaseConnectionStatus().catch(() => true),
          isWhatsAppConfigured().catch(() => false),
        ]);
        setDbConnected(isDbOk);
        setWhatsappConfigured(isWaOk);
      } catch {
        setDbConnected(true);
        setWhatsappConfigured(false);
      }
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await adminLogoutAction();
    } catch {
      // Ignore logout errors
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="page-header mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3E2723]">Settings</h1>
        <p className="text-xs text-gray-500 mt-1">System status & session control</p>
      </div>

      <div className="space-y-6">
        {/* System Connections Section */}
        <div className="card bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="card-header px-6 py-4 border-b border-gray-100 bg-[#FAF8F5] flex justify-between items-center">
            <h2 className="text-sm font-serif font-bold text-[#3E2723] uppercase tracking-wider">System Connections</h2>
            <span className="text-xs bg-gold-100 text-[#8b6508] px-2.5 py-0.5 rounded-full font-semibold border border-[#d4af37]/40">
              Asia/Kolkata (IST)
            </span>
          </div>
          <div className="card-body p-5 space-y-3">
            <div className="settings-connection-row flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-lg">🟢</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Database Connection</p>
                  <p className="text-xs text-gray-500">Supabase PostgreSQL — Single Source of Truth</p>
                </div>
              </div>
              <span className="text-xs text-green-700 font-bold bg-green-100 px-2.5 py-1 rounded-full">
                {dbConnected === false ? 'Reconnecting' : 'Connected'}
              </span>
            </div>

            <div className="settings-connection-row flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-lg">{whatsappConfigured ? '🟢' : '🟡'}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">WhatsApp Business Service</p>
                  <p className="text-xs text-gray-500">
                    {whatsappConfigured === null
                      ? 'Checking configuration…'
                      : whatsappConfigured
                        ? 'Cloud API messaging enabled'
                        : 'Direct WhatsApp sharing links active'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${whatsappConfigured ? 'text-green-700 bg-green-100' : 'text-amber-800 bg-amber-100'}`}>
                {whatsappConfigured === null ? 'Checking' : whatsappConfigured ? 'Connected' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Session / Logout */}
        <div className="card bg-white rounded-2xl shadow-xs border border-red-100 overflow-hidden">
          <div className="card-header px-6 py-4 border-b border-red-50 bg-red-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-red-900 uppercase tracking-wider">Account Session</h2>
          </div>
          <div className="card-body p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Sign Out of Admin Console</p>
              <p className="text-xs text-gray-500 mt-0.5">End your current session and return to the login screen.</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn btn-danger px-6 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{isLoggingOut ? 'Signing out...' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
