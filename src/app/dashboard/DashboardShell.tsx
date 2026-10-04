'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import { adminLogoutAction } from '@/app/actions/auth';

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
    { name: 'Create Coupon', href: '/dashboard/coupons/create', icon: <path d="M12 4v16m8-8H4" /> },
    { name: 'All Coupons', href: '/dashboard/coupons', icon: <path d="M4 6h16M4 12h16M4 18h16" /> },
    { name: 'Verify Coupon', href: '/dashboard/verify', icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  ];

  return (
    <div className="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-[#3E2723] text-white">
        <div className="p-6 flex flex-col items-center border-b border-[#5D4037]">
          <h1 className="text-xl font-semibold text-[#D4AF37] text-center">Akshaya Jewellers</h1>
        </div>
        <nav className="sidebar-nav flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link flex items-center px-6 py-3 transition-colors ${isActive ? 'bg-[#5D4037] text-[#D4AF37] border-r-4 border-[#D4AF37]' : 'hover:bg-[#4E342E]'}`}>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {item.icon}
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#5D4037]">
          <div className="text-sm text-gray-300 mb-4 truncate px-2">{userEmail}</div>
          <button onClick={handleLogout} className="btn btn-secondary w-full flex justify-center items-center">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content md:ml-[260px] pb-16 md:pb-0 min-h-screen bg-gray-50 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-[#3E2723] text-white flex md:hidden justify-around items-center h-16 z-50">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full ${pathname === item.href ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{item.icon}</svg>
            <span className="text-[10px] mt-1">{item.name.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
