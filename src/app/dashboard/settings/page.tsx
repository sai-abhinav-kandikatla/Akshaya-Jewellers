'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogoutAction } from '@/app/actions/auth';
import { isWhatsAppConfigured } from '@/app/actions/whatsapp';
import { getDatabaseConnectionStatus } from '@/app/actions/dashboard';
import BottomSheet from '@/components/BottomSheet';

export default function SettingsPage() {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [whatsappConfigured, setWhatsappConfigured] = useState<boolean | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Promise.all([
      getDatabaseConnectionStatus().catch(() => false),
      isWhatsAppConfigured().catch(() => false),
    ]).then(([database, whatsapp]) => {
      if (active) {
        setDbConnected(database);
        setWhatsappConfigured(whatsapp);
      }
    });
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await adminLogoutAction();
    } catch {
      // The local session is cleared below even if audit logging is unavailable.
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const connectionLabel = (value: boolean | null) => value === null ? 'Checking' : value ? 'Connected' : 'Unavailable';

  return (
    <div className="settings-page">
      <BottomSheet
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out"
        description="Are you sure you want to log out of this account?"
        primaryButtonText="Log out"
        primaryButtonAction={handleLogout}
        secondaryButtonText="Stay signed in"
        secondaryButtonAction={() => setConfirmLogout(false)}
        isLoading={isLoggingOut}
      />

      <div className="page-heading"><h1>Settings</h1></div>
      <section className="settings-group">
        <h2>Account</h2>
        <div className="settings-row"><span>Admin</span><span>Store Manager</span></div>
      </section>
      <section className="settings-group">
        <h2>System</h2>
        <div className="settings-row"><span>Database</span><span>{connectionLabel(dbConnected)}</span></div>
        <div className="settings-row"><span>WhatsApp</span><span>{connectionLabel(whatsappConfigured)}</span></div>
      </section>
      <section className="settings-group">
        <h2>Actions</h2>
        <button className="settings-logout" type="button" onClick={() => setConfirmLogout(true)}>Log out</button>
      </section>
    </div>
  );
}
