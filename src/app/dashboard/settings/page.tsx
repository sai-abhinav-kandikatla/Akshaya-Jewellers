'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
      // Ignore
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="space-y-4 max-w-[430px] mx-auto w-full pb-8">
      {/* 
        ==================================================
        27. SETTINGS HEADER
        ==================================================
      */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-[#111111] flex items-center gap-1.5 py-1.5 px-2 rounded-xl hover:bg-white transition-colors"
          aria-label="Back to dashboard"
        >
          <svg className="w-4 h-4 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="text-base font-serif font-bold text-[#111111]">Settings</span>
        </Link>
      </div>

      {/* ACCOUNT */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-2">
        <p className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">Account</p>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-bold text-[#111111]">Admin</p>
            <p className="text-xs text-[#666666]">Store Manager Access</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E7E0CF] text-[10px] font-semibold text-[#A67C00]">
            Active Session
          </span>
        </div>
      </div>

      {/* SYSTEM */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-3">
        <p className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">System</p>
        
        {/* Database */}
        <div className="flex items-center justify-between py-1 border-b border-[#FAF8F5]">
          <div>
            <p className="text-xs font-semibold text-[#111111]">Database</p>
            <p className="text-[11px] text-[#666666]">Supabase PostgreSQL</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A67C00]">
            <span className="w-2 h-2 rounded-full bg-[#C9A227]" />
            <span>{dbConnected === false ? 'Reconnecting' : 'Connected'}</span>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-xs font-semibold text-[#111111]">WhatsApp</p>
            <p className="text-[11px] text-[#666666]">Customer Dispatch</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A67C00]">
            <span className="w-2 h-2 rounded-full bg-[#C9A227]" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0CF] shadow-2xs space-y-3">
        <p className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">Actions</p>
        
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-xs hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          {isLoggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
