'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogoutAction } from '@/app/actions/auth';

// Clean Lucide-style outline SVG icons (no mixed styles or emojis)
const HomeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CouponsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const VerifyIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const desktopNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { name: 'All Coupons', href: '/dashboard/coupons', icon: <CouponsIcon /> },
  { name: 'Create Coupon', href: '/dashboard/coupons/create', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )},
  { name: 'Verify Coupon', href: '/dashboard/verify', icon: <VerifyIcon /> },
  { name: 'Settings', href: '/dashboard/settings', icon: <SettingsIcon /> },
];

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push('/login');
    router.refresh();
  };

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/coupons') {
      return pathname.startsWith('/dashboard/coupons') && pathname !== '/dashboard/coupons/create';
    }
    return pathname === href;
  };

  return (
    <div className="dashboard-layout min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      {/* 
        ==================================================
        6. MOBILE HEADER (Strictly White & Minimal)
        ==================================================
      */}
      <header className="dashboard-mobile-header md:hidden bg-white border-b border-[#E7E0CF] sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-16 max-w-[430px] mx-auto w-full">
          {/* LEFT & CENTER: Brand Logo + Text */}
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0" aria-label="Akshaya Jewellers Home">
            <img
              src="/logo.png"
              alt="Akshaya Jewellers"
              className="w-10 h-10 rounded-full object-cover border border-[#E7E0CF] flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-[#111111] text-lg leading-tight tracking-tight truncate">
                Akshaya Jewellers
              </h1>
              <p className="text-[11px] text-[#666666] leading-tight truncate">
                Digital Gift Coupon
              </p>
            </div>
          </Link>

          {/* RIGHT: User Profile Icon */}
          <Link
            href="/dashboard/settings"
            className="w-9 h-9 rounded-full border border-[#E7E0CF] bg-white flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Admin Settings & Profile"
            title={userEmail}
          >
            <UserIcon />
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar (Minimal Luxury Style) */}
        <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-[#E7E0CF] z-40">
          <div className="p-6 flex flex-col items-center border-b border-[#E7E0CF]">
            <img
              src="/logo.png"
              alt="Akshaya Jewellers"
              className="w-14 h-14 rounded-full object-cover mb-2 border border-[#E7E0CF]"
            />
            <h1 className="text-xl font-serif font-bold text-[#111111] text-center">
              Akshaya Jewellers
            </h1>
            <p className="text-xs text-[#666666] mt-0.5">Digital Gift Coupon</p>
          </div>

          <nav className="sidebar-nav flex-1 overflow-y-auto py-4" aria-label="Dashboard navigation">
            {desktopNavItems.map((item) => {
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#FAF8F5] text-[#A67C00] border-r-4 border-[#C9A227] font-semibold'
                      : 'text-[#666666] hover:text-[#111111] hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#E7E0CF]">
            <div className="text-xs text-[#666666] mb-3 truncate px-2">{userEmail}</div>
            <button
              onClick={handleLogout}
              className="w-full h-10 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Container (Mobile-First 430px centered constraint) */}
        <main className="main-content flex-1 md:ml-[260px] min-h-screen bg-[#FAF8F5]">
          <div className="w-full max-w-[430px] mx-auto px-4 pt-3 pb-24 md:max-w-4xl md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* 
        ==================================================
        14. MOBILE BOTTOM NAVIGATION (Strictly 5 items)
        ==================================================
      */}
      <nav
        className="mobile-primary-nav md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E7E0CF] z-40 shadow-sm pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around max-w-[430px] mx-auto h-16 px-1">
          {/* 1. Home */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isRouteActive('/dashboard') ? 'text-[#C9A227] font-semibold' : 'text-[#666666]'
            }`}
          >
            <HomeIcon />
            <span className="text-[10px] mt-1">Home</span>
          </Link>

          {/* 2. Coupons */}
          <Link
            href="/dashboard/coupons"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isRouteActive('/dashboard/coupons') ? 'text-[#C9A227] font-semibold' : 'text-[#666666]'
            }`}
          >
            <CouponsIcon />
            <span className="text-[10px] mt-1">Coupons</span>
          </Link>

          {/* 3. Center Elevated + Create Button */}
          <Link
            href="/dashboard/coupons/create"
            className="flex flex-col items-center justify-center -mt-5 group"
            aria-label="Create Coupon"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A227] to-[#A67C00] text-white flex items-center justify-center shadow-md border-2 border-white group-active:scale-95 transition-transform">
              <svg className="w-6 h-6 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#111111] mt-0.5">Create</span>
          </Link>

          {/* 4. Verify */}
          <Link
            href="/dashboard/verify"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isRouteActive('/dashboard/verify') ? 'text-[#C9A227] font-semibold' : 'text-[#666666]'
            }`}
          >
            <VerifyIcon />
            <span className="text-[10px] mt-1">Verify</span>
          </Link>

          {/* 5. Settings */}
          <Link
            href="/dashboard/settings"
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isRouteActive('/dashboard/settings') ? 'text-[#C9A227] font-semibold' : 'text-[#666666]'
            }`}
          >
            <SettingsIcon />
            <span className="text-[10px] mt-1">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
